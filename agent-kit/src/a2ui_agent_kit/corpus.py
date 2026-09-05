"""Record-mode corpus capture: what the model READ, beside what it painted.

The A2UI recorder (`recorder.py`) captures what the model PAINTED; this captures
the MCP payloads it read. One live run derives all three run modes (task-2.6
decision 11): the captured payloads become the stub backend's fixtures via the
agent's `scripts/derive_corpus.py`, so the stub is never hand-authored.

Both captures arm on the same switch (`A2UI_RECORD_DIR`) deliberately — a recorded
run is exactly the run whose payloads become the stub corpus. What (if anything)
must be scrubbed or masked before a payload is captured is vendor policy and stays
in the app; the kit only appends and decodes.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from a2ui_agent_kit.recorder import RECORD_DIR_ENV

logger = logging.getLogger(__name__)


def recording() -> str | None:
    """The record directory when the recorder is armed, else None."""
    return os.environ.get(RECORD_DIR_ENV) or None


def capture_payload(tool_name: str, payload: object) -> None:
    """Appends one MCP payload to the corpus the stub backend is built from."""
    record_dir = recording()
    if not record_dir:
        return
    try:
        target = Path(record_dir) / "payloads"
        target.mkdir(parents=True, exist_ok=True)
        with (target / f"{tool_name}.jsonl").open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(payload) + "\n")
    except (OSError, TypeError, ValueError):
        logger.debug("payload capture failed for %s", tool_name, exc_info=True)


def corpus_payload(result: dict) -> Any:
    """The decoded payload to record for the stub corpus, preferring the structured field."""
    structured = result.get("structuredContent")
    if isinstance(structured, dict) and structured:
        return structured
    for part in result.get("content") or []:
        if isinstance(part, dict) and isinstance(part.get("text"), str):
            try:
                return json.loads(part["text"])
            except ValueError:
                continue
    return {}


def settled_messages(beat_path: Path) -> list[dict]:
    """A beat's SETTLED A2UI message sequence.

    The recorder captures the stream, so a component can appear several times as it is built
    up — a half-written component is a valid thing to see mid-stream and an invalid thing to
    can. Components are merged by id, last write winning, and emitted once. Non-A2UI envelopes
    the recorder interleaves (`paintMeta`) carry no `version` and are dropped.

    Lifted here in task 5.6, from the verbatim copies Gmail's and Calendar's derive scripts
    each carried: a third vendor needed it, and a canned corpus taken from the raw stream
    rather than the settled one is catalog-invalid in a way nothing downstream explains.
    """
    doc = json.loads(beat_path.read_text(encoding="utf-8"))
    creates: list[dict] = []
    data: list[dict] = []
    components: dict[str, dict] = {}
    for turn in doc.get("turns", []):
        for batch in turn.get("batches", []):
            for message in batch.get("messages", []):
                if not isinstance(message, dict) or not message.get("version"):
                    continue
                if "createSurface" in message:
                    creates.append(message)
                elif "updateDataModel" in message:
                    data.append(message)
                elif "updateComponents" in message:
                    for component in message["updateComponents"].get("components", []):
                        if isinstance(component, dict) and component.get("id"):
                            components[component["id"]] = {
                                **components.get(component["id"], {}),
                                **component,
                            }
    out = [*creates, *data]
    kept = _reachable_from_root(components)
    if kept:
        out.append(
            {
                "version": "v0.9",
                "updateComponents": {"components": kept},
            }
        )
    return out


def _reachable_from_root(components: dict[str, dict]) -> list[dict]:
    """The settled components still reachable from `root`, in their streamed order.

    A model may paint a skeleton and then abandon it — `loading_*` placeholders replaced by
    the real tree, which is a streaming behaviour and not a surface. Merging by id keeps those
    orphans, and the live executor never sees them: its own topology pass rejects orphans, so
    the surface it validates is the reachable tree alone. A canned fixture is a settled
    surface, so it is the reachable tree too.

    Reachability is judged by any string anywhere in a component that names another component,
    rather than by the catalog's reference fields — the over-approximation only ever keeps a
    component, and a fixture that keeps one component too many is renderable while one that
    drops a real child is not.
    """
    if "root" not in components:
        return list(components.values())

    def referenced(component: dict) -> set[str]:
        found: set[str] = set()

        def walk(value: object) -> None:
            if isinstance(value, str):
                if value in components:
                    found.add(value)
            elif isinstance(value, list):
                for item in value:
                    walk(item)
            elif isinstance(value, dict):
                for key, item in value.items():
                    if key != "id":
                        walk(item)

        walk(component)
        return found

    reachable = {"root"}
    frontier = ["root"]
    while frontier:
        for child in referenced(components[frontier.pop()]):
            if child not in reachable:
                reachable.add(child)
                frontier.append(child)

    return [component for cid, component in components.items() if cid in reachable]
