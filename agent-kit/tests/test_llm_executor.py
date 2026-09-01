"""L0 executor tests: faked LLM stream, real parser + catalog, zero model calls.

The agents' suite, vendor-neutral: run against the basic fixture config (catalog-kind
coverage lives in test_llm_catalog; question-policy coverage in test_paint_meta).
"""

import json

import pytest
from a2a.types import DataPart, Message, Part, Role, TextPart

from a2ui.schema.constants import VERSION_0_9

from pathlib import Path
import tempfile

from a2uiverse_kit.catalog import catalog_context
from a2uiverse_kit.executor_llm import (
    APOLOGY_TEXT,
    MAX_ATTEMPTS,
    UNAVAILABLE_TEXT,
    LenientA2uiStreamParser,
    LlmAgentExecutor,
)
from a2uiverse_kit.recorder import (
    RECORD_DIR_ENV,
    NullRecorder,
    SessionRecorder,
    create_recorder,
)
from a2uiverse_kit.responder import ModelTurnError

from .conftest import make_config

# One module-level config over a temp app dir: ~40 tests construct executors, and the
# dumps they exercise land under this dir rather than any source tree.
_APP_DIR = Path(tempfile.mkdtemp(prefix="a2uiverse-kit-executor-"))
CONFIG = make_config("basic", _APP_DIR)
EXAMPLES_DIR = CONFIG.examples_dir


def _executor(responder, **kwargs) -> LlmAgentExecutor:
    return LlmAgentExecutor(responder, CONFIG, **kwargs)


def _valid_surface_text() -> str:
    first = sorted(EXAMPLES_DIR.glob("*.json"))[0]
    messages = json.loads(first.read_text(encoding="utf-8"))["messages"]
    return "Here is your surface:\n<a2ui-json>\n" + json.dumps(messages) + "\n</a2ui-json>"


def _valid_surface_text_with_id(surface_id: str) -> str:
    """A valid example surface, re-addressed to `surface_id` on every message.

    Lets a retry target the same surface an earlier attempt created, so the in-place
    patch path (createSurface deduped, components streamed as updates) is exercised.
    """
    first = sorted(EXAMPLES_DIR.glob("*.json"))[0]
    messages = json.loads(first.read_text(encoding="utf-8"))["messages"]
    for msg in messages:
        for key in ("createSurface", "updateComponents", "updateDataModel", "deleteSurface"):
            block = msg.get(key)
            if isinstance(block, dict) and "surfaceId" in block:
                block["surfaceId"] = surface_id
    return "Here is your surface:\n<a2ui-json>\n" + json.dumps(messages) + "\n</a2ui-json>"


# An attempt that creates surface s1 but fails validation (component "Nope" is not in
# the catalog): it streams createSurface(s1) + updateComponents before validate rejects.
_BAD_SURFACE_S1 = (
    'oops<a2ui-json>[{"version":"v0.9","createSurface":{"surfaceId":"s1",'
    '"catalogId":"x"}},{"version":"v0.9","updateComponents":{"surfaceId":"s1",'
    '"components":[{"id":"root","component":"Nope"}]}}]</a2ui-json>'
)


class _FakeResponder:
    """Yields a scripted response per attempt (indexed by number of stream() calls)."""

    def __init__(self, scripts):
        self._scripts = scripts
        self.calls = 0
        self.corrections = []
        self.prompts = []
        self.context_ids = []

    async def stream(self, prompt, correction=None, context_id=None):
        self.corrections.append(correction)
        self.prompts.append(prompt)
        self.context_ids.append(context_id)
        text = self._scripts[min(self.calls, len(self._scripts) - 1)]
        self.calls += 1
        # yield in two chunks to exercise incremental parsing
        mid = len(text) // 2
        for chunk in (text[:mid], text[mid:]):
            yield chunk


class _Ctx:
    def __init__(self, prompt, metadata=None):
        self.message = Message(
            message_id="m1",
            role=Role.user,
            parts=[Part(root=TextPart(text=prompt))],
            metadata=metadata,
        )
        self.current_task = None


class _ActionCtx:
    """A message carrying one v0.9 A2UI action DataPart (the client's action wire form)."""

    def __init__(self, action, metadata=None):
        self.message = Message(
            message_id="m1",
            role=Role.user,
            parts=[Part(root=DataPart(data={"version": "v0.9", "action": action}))],
            metadata=metadata,
        )
        self.current_task = None


class _EmptyCtx:
    """A message carrying a part that is neither usable text nor an A2UI action.

    (A2A rejects a truly empty parts list, so this uses a v0.9 DataPart with no
    `action` key — which the executor must still treat as "nothing to compose".)
    """

    def __init__(self):
        self.message = Message(
            message_id="m1",
            role=Role.user,
            parts=[Part(root=DataPart(data={"version": "v0.9"}))],
        )
        self.current_task = None


class _FakeQueue:
    def __init__(self):
        self.events = []

    async def enqueue_event(self, event):
        self.events.append(event)


def _all_text(queue: _FakeQueue) -> str:
    """Flattens every TextPart across every emitted event/message."""
    chunks = []

    def _scan(obj):
        parts = getattr(obj, "parts", None)
        if parts:
            for p in parts:
                root = getattr(p, "root", p)
                text = getattr(root, "text", None)
                if text:
                    chunks.append(text)

    for event in queue.events:
        _scan(event)  # a Message
        status = getattr(event, "status", None)
        if status is not None:
            _scan(getattr(status, "message", None))
    return "\n".join(chunks)


@pytest.mark.asyncio
async def test_valid_first_attempt_streams_and_completes():
    responder = _FakeResponder([_valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.calls == 1
    assert responder.corrections == [None]  # first-attempt success, no correction
    assert queue.events  # streamed something


@pytest.mark.asyncio
async def test_invalid_then_valid_retries_with_correction():
    bad = (
        'oops<a2ui-json>[{"version":"v0.9","createSurface":{"surfaceId":"s1",'
        '"catalogId":"x"},"updateComponents":{"surfaceId":"s1","components":'
        '[{"id":"root","component":"Nope"}]}}]</a2ui-json>'
    )
    responder = _FakeResponder([bad, _valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.calls == 2
    assert responder.corrections[0] is None
    assert responder.corrections[1] is not None
    assert "validation" in responder.corrections[1].lower()


@pytest.mark.asyncio
async def test_unparseable_block_mid_stream_retries_then_succeeds():
    # The parser raises ValueError on a block with no valid JSON; that must feed the
    # correction/retry loop, not escape the executor as a server error.
    bad = "<a2ui-json>not json at all</a2ui-json>"
    responder = _FakeResponder([bad, _valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.calls == 2
    assert responder.corrections[1] is not None


@pytest.fixture(autouse=True)
def failed_stream_dump():
    """The config-anchored failure dump, cleared per test (the app dir is a temp dir)."""
    path = _APP_DIR / "failed_stream.dump.txt"
    path.unlink(missing_ok=True)
    yield path
    path.unlink(missing_ok=True)


class _FailingResponder:
    """Raises mid-stream on the first call, then succeeds with a valid surface."""

    def __init__(self, failures=1):
        self._failures = failures
        self.calls = 0

    async def stream(self, prompt, correction=None, context_id=None):
        self.calls += 1
        if self.calls <= self._failures:
            yield "partial "
            raise RuntimeError("503 UNAVAILABLE")
        for chunk in (_valid_surface_text(),):
            yield chunk


def _data_parts(queue: _FakeQueue) -> list[dict]:
    out = []

    def _scan(obj):
        for p in getattr(obj, "parts", None) or []:
            root = getattr(p, "root", p)
            data = getattr(root, "data", None)
            if data is not None:
                out.append(data)

    for event in queue.events:
        _scan(event)
        status = getattr(event, "status", None)
        if status is not None:
            _scan(getattr(status, "message", None))
    return out


@pytest.mark.asyncio
async def test_streaming_traverses_custom_component_reference_props():
    # Reachability: the catalog-less parser has no ref-field map, so components
    # referenced through custom props (Card.child, Button.child — not `children`)
    # were unreachable and silently dropped from the stream. The executor hands the
    # parser the live catalog's ref map to fix that.
    surface = json.dumps(
        [
            {
                "version": "v0.9",
                "createSurface": {"surfaceId": "s", "catalogId": "c"},
            },
            {
                "version": "v0.9",
                "updateComponents": {
                    "surfaceId": "s",
                    "components": [
                        {"id": "root", "component": "Card", "child": "hd"},
                        {"id": "hd", "component": "Button", "child": "ct"},
                        {"id": "ct", "component": "Text", "text": "content text"},
                    ],
                },
            },
        ]
    )
    responder = _FakeResponder(["<a2ui-json>" + surface + "</a2ui-json>"])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show the page"), queue)

    streamed_ids = set()
    for d in _data_parts(queue):
        for c in (d.get("updateComponents") or {}).get("components", []):
            streamed_ids.add(c.get("id"))
    assert {"root", "hd", "ct"} <= streamed_ids


@pytest.mark.asyncio
async def test_exhausted_infra_failure_tears_down_partial_surface():
    # Retries no longer tear down between attempts (they patch in place), but once
    # every attempt has failed the half-streamed surface must be cleaned up before the
    # apology — the client is not left with a zombie placeholder.
    responder = _FailingResponder(failures=MAX_ATTEMPTS)
    executor = _executor(responder)
    queue = _FakeQueue()

    async def failing_stream(prompt, correction=None, context_id=None):
        yield '<a2ui-json>[{"version": "v0.9", "createSurface": {"surfaceId": "zomb", "catalogId": "c"}}'
        raise RuntimeError("503 UNAVAILABLE")

    responder.stream = failing_stream
    await executor.execute(_Ctx("show me open PRs"), queue)
    deletes = [d for d in _data_parts(queue) if "deleteSurface" in d]
    assert deletes, "expected a deleteSurface teardown once attempts are exhausted"
    assert deletes[0]["deleteSurface"]["surfaceId"] == "zomb"


@pytest.mark.asyncio
async def test_invalid_retry_patches_surface_in_place():
    # Attempt 1 creates surface s1 but fails validation; the retry must PATCH s1 in
    # place (updateComponents deltas) rather than deleteSurface + re-create it — no
    # wipe-and-redraw. So createSurface(s1) streams exactly once, no deleteSurface is
    # ever emitted, and the task completes.
    responder = _FakeResponder([_BAD_SURFACE_S1, _valid_surface_text_with_id("s1")])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)

    assert responder.calls == 2
    data = _data_parts(queue)
    creates = [
        d for d in data
        if "createSurface" in d and d["createSurface"].get("surfaceId") == "s1"
    ]
    assert len(creates) == 1  # created once; the retry did not re-create it
    assert not [d for d in data if "deleteSurface" in d]  # never torn down
    assert APOLOGY_TEXT not in _all_text(queue)  # completed successfully
    assert [  # the retry streamed corrected components as in-place updates
        d for d in data
        if "updateComponents" in d and d["updateComponents"].get("surfaceId") == "s1"
    ]


@pytest.mark.asyncio
async def test_invalid_exhaustion_tears_down_then_apologizes():
    # Every attempt fails validation: the surface is created once (the retry dedups
    # its createSurface), then cleaned up once on exhaustion, then the apology.
    responder = _FakeResponder([_BAD_SURFACE_S1])  # repeated for every attempt
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)

    assert responder.calls == MAX_ATTEMPTS
    data = _data_parts(queue)
    creates = [
        d for d in data
        if "createSurface" in d and d["createSurface"].get("surfaceId") == "s1"
    ]
    assert len(creates) == 1  # created once even across retries
    deletes = [
        d for d in data
        if "deleteSurface" in d and d["deleteSurface"].get("surfaceId") == "s1"
    ]
    assert len(deletes) == 1  # cleaned up once, on exhaustion
    assert APOLOGY_TEXT in _all_text(queue)


@pytest.mark.asyncio
async def test_model_failure_mid_stream_retries_then_succeeds():
    # A provider error (quota, 5xx, network) must not abort the SSE stream raw;
    # it counts as a failed attempt and the prompt is retried unchanged.
    responder = _FailingResponder(failures=1)
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.calls == 2
    assert APOLOGY_TEXT not in _all_text(queue)


@pytest.mark.asyncio
async def test_model_failure_exhaustion_emits_unavailable_text():
    responder = _FailingResponder(failures=MAX_ATTEMPTS)
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.calls == MAX_ATTEMPTS
    assert UNAVAILABLE_TEXT in _all_text(queue)


class _ModelTurnErrorResponder:
    """Raises ModelTurnError(code) for the first `failures` calls, then succeeds.

    Mirrors a Gemini turn aborted before any token (e.g. MALFORMED_FUNCTION_CALL):
    the responder stream raises with nothing yielded.
    """

    def __init__(self, code, failures=1):
        self._code = code
        self._failures = failures
        self.calls = 0
        self.corrections = []

    async def stream(self, prompt, correction=None, context_id=None):
        self.calls += 1
        self.corrections.append(correction)
        if self.calls <= self._failures:
            raise ModelTurnError(self._code)
            yield  # pragma: no cover — marks this as a generator
        yield _valid_surface_text()


@pytest.mark.asyncio
async def test_malformed_function_call_retries_with_a_targeted_correction():
    # A MALFORMED_FUNCTION_CALL turn produced no output at all; the retry must name
    # that failure — not claim a phantom A2UI response "failed validation".
    responder = _ModelTurnErrorResponder("MALFORMED_FUNCTION_CALL", failures=1)
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me the first and second PRs"), queue)

    assert responder.calls == 2
    correction = responder.corrections[1]
    assert correction is not None
    assert "malformed function call" in correction.lower()
    assert "validation" not in correction.lower()
    assert APOLOGY_TEXT not in _all_text(queue)  # the retry recovered


@pytest.mark.asyncio
async def test_malformed_function_call_exhaustion_emits_the_compose_apology():
    responder = _ModelTurnErrorResponder(
        "MALFORMED_FUNCTION_CALL", failures=MAX_ATTEMPTS
    )
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me the first and second PRs"), queue)

    assert responder.calls == MAX_ATTEMPTS
    # A composition failure, not a provider outage.
    assert APOLOGY_TEXT in _all_text(queue)
    assert UNAVAILABLE_TEXT not in _all_text(queue)


@pytest.mark.asyncio
async def test_other_empty_turn_errors_retry_unchanged_then_report_unavailable():
    responder = _ModelTurnErrorResponder("MAX_TOKENS", failures=MAX_ATTEMPTS)
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)

    assert responder.calls == MAX_ATTEMPTS
    assert responder.corrections == [None] * MAX_ATTEMPTS  # prompt retried unchanged
    assert UNAVAILABLE_TEXT in _all_text(queue)


@pytest.mark.asyncio
async def test_streamed_parts_preserve_relative_template_bindings():
    # The SDK's catalog-less stream parser arms a v0.8 shim that rewrites relative
    # binding paths absolute ('title' -> '/title'), which breaks template item
    # bindings on the client. The executor pins the parser version to disarm it.
    surface = json.dumps(
        [
            {
                "version": "v0.9",
                "createSurface": {"surfaceId": "s", "catalogId": "c"},
            },
            {
                "version": "v0.9",
                "updateComponents": {
                    "surfaceId": "s",
                    "components": [
                        {
                            "id": "root",
                            "component": "Column",
                            "children": {"componentId": "row", "path": "/items"},
                        },
                        {"id": "row", "component": "Text", "text": {"path": "title"}},
                    ],
                },
            },
            {
                "version": "v0.9",
                "updateDataModel": {
                    "surfaceId": "s",
                    "path": "/",
                    "value": {"items": [{"title": "one"}]},
                },
            },
        ]
    )
    responder = _FakeResponder(["<a2ui-json>" + surface + "</a2ui-json>"])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("list items"), queue)

    data_parts = []

    def _scan(obj):
        for p in getattr(obj, "parts", None) or []:
            root = getattr(p, "root", p)
            data = getattr(root, "data", None)
            if data is not None:
                data_parts.append(data)

    for event in queue.events:
        _scan(event)
        status = getattr(event, "status", None)
        if status is not None:
            _scan(getattr(status, "message", None))

    streamed = json.dumps(data_parts)
    assert '"title"' in streamed  # the row component streamed with its binding
    assert "/title" not in streamed  # the relative item binding survived untouched


@pytest.mark.asyncio
async def test_exhaustion_emits_plain_text_apology():
    responder = _FakeResponder(["nothing useful here"])  # no <a2ui-json> block at all
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.calls == MAX_ATTEMPTS  # retried up to the cap
    assert APOLOGY_TEXT in _all_text(queue)


@pytest.mark.asyncio
async def test_chunk_split_inside_a_prefixed_child_id_does_not_fail_the_attempt():
    # A chunk boundary inside "row-0-lv", right after the parent id "row-0", heals into
    # a momentary self-reference (children ["row-0"] on 'row-0'); the incremental
    # parser must skip that yield and let the next chunk complete the id, instead of
    # failing the attempt. Genuine cycles are still rejected at end-of-stream by
    # validate_surface's topology pass. (Live regression: 'body', then 'row-0'.)
    surface = json.dumps(
        [
            {"version": "v0.9", "createSurface": {"surfaceId": "s", "catalogId": "c"}},
            {
                "version": "v0.9",
                "updateComponents": {
                    "surfaceId": "s",
                    "components": [
                        {
                            "id": "root",
                            "component": "Column",
                                                                                    "children": ["row-0"],
                        },
                        {
                            "id": "row-0",
                            "component": "Column",
                            "align": "center",
                            "children": ["row-0-lv", "row-0-title"],
                        },
                        {"id": "row-0-lv", "component": "Text", "text": "x"},
                        {"id": "row-0-title", "component": "Text", "text": "y"},
                    ],
                },
            },
        ]
    )
    text = "<a2ui-json>" + surface + "</a2ui-json>"
    cut = text.index('"row-0-lv"') + len('"row-0')

    class _ChunkedResponder:
        def __init__(self, chunks):
            self._chunks = chunks
            self.calls = 0

        async def stream(self, prompt, correction=None, context_id=None):
            self.calls += 1
            for chunk in self._chunks:
                yield chunk

    responder = _ChunkedResponder([text[:cut], text[cut:]])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show the queue"), queue)

    assert responder.calls == 1  # no retry: the split was healed, not failed
    assert APOLOGY_TEXT not in _all_text(queue)
    streamed_ids = set()
    for d in _data_parts(queue):
        for c in (d.get("updateComponents") or {}).get("components", []):
            streamed_ids.add(c.get("id"))
    assert "row-0-lv" in streamed_ids  # the completed id made it to the client


@pytest.mark.asyncio
async def test_mid_stream_parse_error_closes_the_responder_stream():
    # A parser error breaks out of the token loop with the model stream suspended.
    # The executor must close it in-task before the next attempt — left to GC, the
    # ADK run unwinds in a foreign context (late cancellation, otel detach noise).
    class _TrackingResponder:
        def __init__(self):
            self.calls = 0
            self.closed = 0

        async def stream(self, prompt, correction=None, context_id=None):
            self.calls += 1
            try:
                if self.calls == 1:
                    yield "<a2ui-json>not json at all</a2ui-json>"
                    yield "never consumed"
                else:
                    yield _valid_surface_text()
            finally:
                self.closed += 1

    responder = _TrackingResponder()
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)

    assert responder.calls == 2  # the parse error fed the retry loop
    assert responder.closed == 2  # every attempt's stream closed before returning


@pytest.mark.asyncio
async def test_responder_receives_the_task_context_id_on_every_attempt():
    # Session continuity: the responder keys its model session on the A2A context id,
    # so the executor must thread task.context_id into every stream() call — the first
    # attempt and correction retries alike.
    responder = _FakeResponder([_BAD_SURFACE_S1, _valid_surface_text_with_id("s1")])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)

    task = queue.events[0]  # the new_task event the executor enqueues first
    assert task.context_id
    assert responder.context_ids == [task.context_id] * 2


@pytest.mark.asyncio
async def test_action_event_is_framed_into_the_model_prompt():
    # An incoming A2UI action DataPart (no TextPart) must resolve to a model turn that
    # names the action and carries its resolved context, not an empty prompt.
    action = {
        "name": "approve",
        "surfaceId": "s1",
        "sourceComponentId": "approve-btn",
        "context": {"prNumber": 42, "assignee": "octocat"},
    }
    responder = _FakeResponder([_valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_ActionCtx(action), queue)

    assert responder.calls == 1  # the action was turned into a real model call
    prompt = responder.prompts[0]
    assert prompt  # not empty
    assert "approve" in prompt  # the action name is framed in
    assert "prNumber" in prompt and "42" in prompt  # resolved context values carried
    assert "assignee" in prompt and "octocat" in prompt
    assert "action" in prompt.lower()  # framed as an activated action


# The client data model as it rides the A2A wire: surfaces created with
# sendDataModel:true make the client attach metadata["a2uiClientDataModel"] =
# {version, surfaces: {surfaceId: dataModel}} to every message it sends.
_CLIENT_DM_METADATA = {
    "a2uiClientDataModel": {
        "version": "v0.9",
        "surfaces": {
            "review-queue": {
                "prs": [
                    {"title": "Add incremental heal", "selected": True},
                    {"title": "Spike pruning", "selected": False},
                ]
            }
        },
    }
}


@pytest.mark.asyncio
async def test_client_data_model_metadata_is_framed_into_the_text_prompt():
    # The user's local edits (checkbox selections) live only in the client-side data
    # model; the client reports them via message metadata, and the executor must put
    # them in front of the model or "show me the selected PRs" cannot be answered.
    responder = _FakeResponder([_valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(
        _Ctx("show me the selected PRs", metadata=_CLIENT_DM_METADATA), queue
    )

    prompt = responder.prompts[0]
    assert prompt.startswith("show me the selected PRs")
    assert "review-queue" in prompt  # the surface's reported state is framed in
    assert "Add incremental heal" in prompt
    assert "true" in prompt  # the selected flags survive as JSON values


@pytest.mark.asyncio
async def test_client_data_model_metadata_is_framed_into_the_action_prompt():
    action = {
        "name": "openSelected",
        "surfaceId": "review-queue",
        "sourceComponentId": "open-btn",
        "context": {},
    }
    responder = _FakeResponder([_valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_ActionCtx(action, metadata=_CLIENT_DM_METADATA), queue)

    prompt = responder.prompts[0]
    assert "openSelected" in prompt  # the action framing is still there
    assert "Add incremental heal" in prompt  # and the client state rides along


@pytest.mark.asyncio
async def test_absent_metadata_leaves_the_prompt_untouched():
    responder = _FakeResponder([_valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.prompts[0] == "show me open PRs"


@pytest.mark.asyncio
async def test_malformed_client_data_model_metadata_is_ignored():
    responder = _FakeResponder([_valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(
        _Ctx("show me open PRs", metadata={"a2uiClientDataModel": "garbage"}), queue
    )
    assert responder.prompts[0] == "show me open PRs"


@pytest.mark.asyncio
async def test_empty_message_apologizes_without_calling_the_model():
    # A message with neither text nor an action part must not reach the model (an empty
    # prompt is rejected by the provider); it gets the plain-text apology directly.
    responder = _FakeResponder([_valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_EmptyCtx(), queue)

    assert responder.calls == 0  # no model call at all
    assert APOLOGY_TEXT in _all_text(queue)


# --- Non-string component ids (the "cannot use 'dict' as a dict key" TypeError) ---

# A component whose `id` is an object rather than a string. The SDK caches components
# by id with no type guard (a2ui/parser/streaming_v09.py, a2ui/parser/streaming.py),
# so the id reaches a dict subscript and raises TypeError mid-stream — a different
# exception class from the ValueError the malformed-block path is built around.
_DICT_ID_SURFACE = (
    '<a2ui-json>[{"version":"v0.9","createSurface":{"surfaceId":"s1","catalogId":"x"}},'
    '{"version":"v0.9","updateComponents":{"surfaceId":"s1","root":"root",'
    '"components":[{"id":{"componentId":"root"},"component":"Text","text":"hi"}]}}]'
    "</a2ui-json>"
)


def _lenient_parser() -> LenientA2uiStreamParser:
    """A parser wired exactly as the executor wires it."""
    parser = LenientA2uiStreamParser(catalog=None)
    parser._version = VERSION_0_9
    parser._ref_fields_map = catalog_context(CONFIG).live_ref_fields()
    return parser


def test_parser_never_caches_a_component_whose_id_is_not_a_string():
    parser = _lenient_parser()

    # Dropping the malformed root leaves the surface rootless, which the SDK reports
    # as ValueError. That class is the point: ValueError is a correctable malformed
    # block, whereas the unguarded TypeError bypassed the correction loop entirely.
    with pytest.raises(ValueError):
        parser.process_chunk(_DICT_ID_SURFACE)

    assert all(isinstance(key, str) for key in parser._seen_components)


def test_parser_keeps_streaming_when_only_a_leaf_id_is_malformed():
    parser = _lenient_parser()

    parser.process_chunk(
        '<a2ui-json>[{"version":"v0.9","createSurface":{"surfaceId":"s1",'
        '"catalogId":"x"}},{"version":"v0.9","updateComponents":{"surfaceId":"s1",'
        '"root":"root","components":[{"id":"root","component":"Text","text":"hi"},'
        '{"id":{"componentId":"leaf"},"component":"Text","text":"bad"}]}}]</a2ui-json>'
    )

    assert set(parser._seen_components) == {"root"}


@pytest.mark.asyncio
async def test_non_string_id_feeds_the_correction_retry_loop():
    # The TypeError must be treated as a malformed block, not as a provider outage:
    # the retry carries a correction, and a recoverable second attempt succeeds.
    responder = _FakeResponder([_DICT_ID_SURFACE, _valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()

    await executor.execute(_Ctx("list my public repos"), queue)

    assert responder.calls == 2
    assert responder.corrections[1] is not None  # attempt 2 was told what went wrong
    assert APOLOGY_TEXT not in _all_text(queue)


@pytest.mark.asyncio
async def test_non_string_id_exhaustion_apologizes_without_blaming_the_provider():
    # Exhausting attempts on a malformed surface is a model failure, not an outage;
    # UNAVAILABLE_TEXT would send debugging after a provider that is working fine.
    responder = _FakeResponder([_DICT_ID_SURFACE])  # repeated for every attempt
    executor = _executor(responder)
    queue = _FakeQueue()

    await executor.execute(_Ctx("list my public repos"), queue)

    text = _all_text(queue)
    assert APOLOGY_TEXT in text
    assert UNAVAILABLE_TEXT not in text


@pytest.mark.asyncio
async def test_unexpected_stream_failure_is_logged_with_a_traceback(caplog):
    # Without exc_info the log names the exception but not where it came from, which
    # is what made the non-string-id crash unattributable in production.
    responder = _FailingResponder(failures=1)
    executor = _executor(responder)
    queue = _FakeQueue()

    with caplog.at_level("WARNING", logger="a2uiverse_kit.executor_llm"):
        await executor.execute(_Ctx("list my public repos"), queue)

    failures = [r for r in caplog.records if "model stream failed" in r.getMessage()]
    assert failures
    assert failures[0].exc_info is not None


@pytest.mark.asyncio
async def test_unexpected_stream_failure_dumps_the_accumulated_model_text(
    failed_stream_dump,
):
    # The model text is the evidence for diagnosing what shape provoked the failure;
    # it is lost entirely once the attempt is abandoned.
    dump = failed_stream_dump
    responder = _FailingResponder(failures=1)
    executor = _executor(responder)
    queue = _FakeQueue()

    await executor.execute(_Ctx("list my public repos"), queue)

    assert dump.exists()
    assert "partial " in dump.read_text(encoding="utf-8")


def test_non_string_id_guard_survives_the_between_attempt_reset():
    # The executor resets parser JSON state between attempts while deliberately
    # keeping the component cache (it drives in-place patching). If a future SDK
    # version rebuilt that cache, the guard would vanish silently and the crash
    # would return on the retry path only.
    parser = _lenient_parser()
    parser.process_chunk('<a2ui-json>[{"version":"v0.9","createSurface":'
                         '{"surfaceId":"s1","catalogId":"x"}}]</a2ui-json>')

    parser._reset_json_state()
    parser._seen_components[{"componentId": "x"}] = {"id": "x"}

    assert all(isinstance(key, str) for key in parser._seen_components)


@pytest.mark.asyncio
async def test_invalid_surface_logs_the_raw_model_response(caplog):
    # A validation failure says what was wrong with the surface but never showed what
    # the model actually emitted, so a repeating failure could not be diagnosed.
    responder = _FakeResponder([_BAD_SURFACE_S1, _valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()

    with caplog.at_level("WARNING", logger="a2uiverse_kit.executor_llm"):
        await executor.execute(_Ctx("show me open PRs"), queue)

    # "oops" is the model's prose preface: it appears in the raw response and nowhere
    # in the validation verdict, so it can only come from the response being logged.
    assert "oops" in caplog.text


@pytest.mark.asyncio
async def test_invalid_surface_dumps_the_raw_model_response(failed_stream_dump):
    responder = _FakeResponder([_BAD_SURFACE_S1, _valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()

    await executor.execute(_Ctx("show me open PRs"), queue)

    assert failed_stream_dump.exists()
    assert "Nope" in failed_stream_dump.read_text(encoding="utf-8")


# --- wire recording (task 8.1) -------------------------------------------------------


def _recorded_session(record_dir):
    return json.loads(next(record_dir.glob("*.json")).read_text(encoding="utf-8"))


@pytest.mark.asyncio
async def test_recording_is_off_unless_the_env_knob_is_set(monkeypatch):
    monkeypatch.delenv(RECORD_DIR_ENV, raising=False)
    executor = _executor(_FakeResponder([_valid_surface_text()]))
    assert isinstance(executor._recorder, NullRecorder)


@pytest.mark.asyncio
async def test_the_env_knob_arms_a_session_recorder(monkeypatch, tmp_path):
    monkeypatch.setenv(RECORD_DIR_ENV, str(tmp_path))
    executor = _executor(_FakeResponder([_valid_surface_text()]))
    assert isinstance(executor._recorder, SessionRecorder)


@pytest.mark.asyncio
async def test_an_armed_executor_records_the_turn_it_streamed(tmp_path):
    executor = _executor(
        _FakeResponder([_valid_surface_text()]), recorder=create_recorder(str(tmp_path))
    )
    await executor.execute(_Ctx("show me open PRs"), _FakeQueue())

    session = _recorded_session(tmp_path)
    (turn,) = session["turns"]
    assert turn["kind"] == "utterance"
    assert turn["prompt"] == "show me open PRs"
    assert turn["outcome"] == "completed"
    assert turn["batches"], "a successful turn streamed at least one batch"


@pytest.mark.asyncio
async def test_the_recorded_batches_carry_the_surface_the_client_would_have_received(tmp_path):
    executor = _executor(
        _FakeResponder([_valid_surface_text()]), recorder=create_recorder(str(tmp_path))
    )
    await executor.execute(_Ctx("show me open PRs"), _FakeQueue())

    (turn,) = _recorded_session(tmp_path)["turns"]
    streamed = [msg for batch in turn["batches"] for msg in batch["messages"]]
    assert any("createSurface" in msg for msg in streamed)
    assert all(msg["version"] == "v0.9" for msg in streamed)


@pytest.mark.asyncio
async def test_an_action_turn_records_the_action_that_drove_it(tmp_path):
    action = {"name": "open-pull-request", "context": {"number": 2093}}
    executor = _executor(
        _FakeResponder([_valid_surface_text()]), recorder=create_recorder(str(tmp_path))
    )
    await executor.execute(_ActionCtx(action), _FakeQueue())

    (turn,) = _recorded_session(tmp_path)["turns"]
    assert turn["kind"] == "surface-action"
    assert turn["action"] == action


@pytest.mark.asyncio
async def test_an_exhausted_turn_is_recorded_as_an_apology(tmp_path, failed_stream_dump):
    """A failed paint is a fixture too: 8.3 must prove it never reaches the stage."""
    executor = _executor(
        _FakeResponder([_BAD_SURFACE_S1]), recorder=create_recorder(str(tmp_path))
    )
    await executor.execute(_Ctx("show me open PRs"), _FakeQueue())

    (turn,) = _recorded_session(tmp_path)["turns"]
    assert turn["outcome"] == "apology"
    streamed = [msg for batch in turn["batches"] for msg in batch["messages"]]
    # The teardown that removes the half-built surface is part of what the client saw.
    assert any("deleteSurface" in msg for msg in streamed)


@pytest.mark.asyncio
async def test_recording_never_changes_what_the_client_receives(tmp_path):
    """The knob is diagnostics: armed and unarmed runs must emit the same events."""
    unarmed_queue, armed_queue = _FakeQueue(), _FakeQueue()
    await _executor(_FakeResponder([_valid_surface_text()])).execute(
        _Ctx("show me open PRs"), unarmed_queue
    )
    await _executor(
        _FakeResponder([_valid_surface_text()]), recorder=create_recorder(str(tmp_path))
    ).execute(_Ctx("show me open PRs"), armed_queue)

    assert _all_text(unarmed_queue) == _all_text(armed_queue)
    assert len(unarmed_queue.events) == len(armed_queue.events)


# ---- task 8.5: paint titles, question marker, fork context ----

from a2uiverse_kit.executor_llm import (  # noqa: E402
    FORK_CONTEXT_KEY,
    _frame_fork_context,
    _resolve_prompt,
)


def _titled_surface_text(surface_id: str = "s1", kind: str | None = None) -> str:
    tag_kind = f' kind="{kind}"' if kind else ""
    return (
        f'<paint-title surface="{surface_id}"{tag_kind}>Waiting on you</paint-title>\n'
        + _valid_surface_text_with_id(surface_id)
    )


@pytest.mark.asyncio
async def test_paint_title_tag_becomes_paint_meta_part_before_create():
    responder = _FakeResponder([_titled_surface_text("s1")])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)

    data = _data_parts(queue)
    meta_indices = [i for i, d in enumerate(data) if "paintMeta" in d]
    create_indices = [
        i for i, d in enumerate(data)
        if "createSurface" in d and d["createSurface"].get("surfaceId") == "s1"
    ]
    assert meta_indices and create_indices
    assert meta_indices[0] < create_indices[0]  # the title leads the paint
    assert data[meta_indices[0]]["paintMeta"] == {
        "surfaceId": "s1",
        "title": "Waiting on you",
    }
    # The tag is stripped from the prose channel.
    assert "<paint-title" not in _all_text(queue)
    assert APOLOGY_TEXT not in _all_text(queue)


@pytest.mark.asyncio
async def test_unanswerable_question_marker_feeds_correction_retry():
    # Attempt 1 declares kind="question" on a surface carrying no action: validate_surface
    # passes, the marker rule rejects because the user could not answer it, and the
    # correction names the move. Attempt 2 drops the kind and completes.
    actionless = (
        '<paint-title surface="s1" kind="question">Save this reply?</paint-title>\n'
        "Here is your surface:\n<a2ui-json>\n"
        + json.dumps([{"version": "v0.9", "createSurface": {"surfaceId": "s1", "catalogId": "c"}}, {"version": "v0.9", "updateComponents": {"surfaceId": "s1", "components": [{"id": "root", "component": "Card", "child": "q"}, {"id": "q", "component": "Text", "text": "Save this reply?"}]}}])
        + "\n</a2ui-json>"
    )
    responder = _FakeResponder([actionless, _titled_surface_text("s1")])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("draft a reply"), queue)

    assert responder.calls == 2
    assert responder.corrections[1] is not None
    assert "carries no action" in responder.corrections[1]
    assert APOLOGY_TEXT not in _all_text(queue)


@pytest.mark.asyncio
async def test_unclosed_tag_tail_is_flushed_at_stream_end():
    # An opened <paint-title> whose close never streams is held by the filter for the
    # whole stream; at stream end it must be released verbatim — no prose is lost.
    tail = '\n<paint-title surface="s1">never closed'
    responder = _FakeResponder([_valid_surface_text() + tail])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    text = _all_text(queue)
    assert "never closed" in text
    assert "<paint-title" in text  # released as plain prose, not swallowed


def test_fork_context_framed_into_action_prompt():
    action = {"name": "open-pr", "context": {"number": 48}}
    fork = {"paintId": 4, "title": "Waiting on you", "paintedAt": 1755230000000, "position": 3}
    ctx = _ActionCtx(action, metadata={FORK_CONTEXT_KEY: fork})
    prompt = _resolve_prompt(ctx)
    assert "HISTORICAL" in prompt
    assert "'Waiting on you'" in prompt
    assert "3 paints behind the current view" in prompt
    assert "Refetch live data" in prompt
    assert "NEWEST view" in prompt


def test_fork_context_framed_into_utterance_prompt_before_data_model():
    fork = {"paintId": 2, "title": "PR #48 review", "paintedAt": 1755230000000, "position": 1}
    model = {"version": "v0.9", "surfaces": {"s1": {"sel": True}}}
    ctx = _Ctx(
        "what changed here?",
        metadata={FORK_CONTEXT_KEY: fork, "a2uiClientDataModel": model},
    )
    prompt = _resolve_prompt(ctx)
    assert prompt.index("HISTORICAL") < prompt.index("Current data model")
    assert "1 paint behind the current view" in prompt


def test_fork_frame_tolerates_missing_fields():
    prompt = _frame_fork_context({})
    assert "a past view" in prompt
    assert "behind the current view" not in prompt  # no position claimed


def test_no_fork_context_means_no_historical_framing():
    prompt = _resolve_prompt(_Ctx("show me open PRs"))
    assert "HISTORICAL" not in prompt


def _all_data_parts(queue: _FakeQueue) -> list[dict]:
    """Every DataPart payload across every emitted event/message."""
    datas = []

    def _scan(obj):
        parts = getattr(obj, "parts", None)
        if parts:
            for p in parts:
                root = getattr(p, "root", p)
                data = getattr(root, "data", None)
                if isinstance(data, dict):
                    datas.append(data)

    for event in queue.events:
        _scan(event)
        status = getattr(event, "status", None)
        if status is not None:
            _scan(getattr(status, "message", None))
    return datas


@pytest.mark.asyncio
async def test_declared_no_surface_turn_completes_without_painting():
    responder = _FakeResponder(
        [
            "I cannot post comments — every tool is read-only. "
            "Your draft stays unsubmitted, still in the view.\n<no-surface/>\n"
        ]
    )
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("confirm posting the comment"), queue)
    assert responder.calls == 1  # a declared prose-only turn is valid: no retry
    assert responder.corrections == [None]
    text = _all_text(queue)
    assert "read-only" in text
    assert "no-surface" not in text  # the marker never reaches the prose channel
    assert _all_data_parts(queue) == []  # nothing painted, nothing torn down


@pytest.mark.asyncio
async def test_undeclared_surfaceless_response_still_retries():
    responder = _FakeResponder(["just prose, no marker", _valid_surface_text()])
    executor = _executor(responder)
    queue = _FakeQueue()
    await executor.execute(_Ctx("show me open PRs"), queue)
    assert responder.calls == 2
    assert responder.corrections[1] is not None
    assert "no A2UI surface" in responder.corrections[1]
