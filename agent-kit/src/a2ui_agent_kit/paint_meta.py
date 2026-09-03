"""Paint-meta shell layer (task 8.5): the <paint-title> tag -> paintMeta DataPart bridge.

The canvas shell wants a per-paint human title and a question marker on the wire
(phase-8 decisions 8 and task-8.5). A2UI v0.9 messages are sealed
(additionalProperties: false), so both ride OUTSIDE the protocol, as a dedicated
shell-metadata DataPart -- `{"paintMeta": {surfaceId, title, kind?}}` under its own
MIME type -- emitted ahead of the createSurface it names. The model sources them as
a tagged element in its prose, before the surface's <a2ui-json> block:

    <paint-title surface="thread-2251" kind="question">Send this reply?</paint-title>

Titles are best-effort (no tag -> no part -> the client's cause-derived fallback). The
question marker is the client's whole contract -- it routes on the marker alone, its
structural fallback having been removed -- so a question MUST be declared. What a
declared question is checked AGAINST is app policy, not a canvas invariant: the config
selects a question policy, and the kit ships the two known ones — `require_carries_action`
(a declared question must be answerable) and `require_root_component(name)` (marker and
a purpose-built dialog root imply each other).

The same tag channel carries one more shell marker: <no-surface/>, the model's
declared prose-only turn. Emitting it says "this turn deliberately paints nothing"
(a declined confirmation, a change whose result is already on screen, a request outside
the app's domain, or an action whose tool this agent does not hold). The filter strips it
from the prose and raises its `no_surface` flag; the executor accepts a surfaceless
response only under that flag -- an undeclared surfaceless response is still a validation
failure that retries.
"""

from __future__ import annotations

import logging
import re

from a2a.types import DataPart, Part

logger = logging.getLogger(__name__)

# The shell-metadata DataPart's MIME tag. Distinct from the A2UI parts' MIME and from
# their inline `version` field, so neither side's A2UI extraction can confuse the two.
PAINT_META_MIME = "application/json+a2ui-shell"
QUESTION_KIND = "question"

_TAG_RE = re.compile(r"<paint-title\b([^>]*)>(.*?)</paint-title>", re.DOTALL)
# Any spelling of the no-surface marker: <no-surface/>, <no-surface>, </no-surface>.
_NO_SURFACE_RE = re.compile(r"</?no-surface\b[^>]*>")
_ATTR_RE = re.compile(r'([a-zA-Z-]+)\s*=\s*"([^"]*)"')
_OPEN_PREFIX = "<paint-title"
_HOLD_PREFIXES = (_OPEN_PREFIX, "<no-surface", "</no-surface")


def create_paint_meta_part(meta: dict) -> Part:
    """The paintMeta shell DataPart, as it rides the A2A stream."""
    return Part(
        root=DataPart(data={"paintMeta": meta}, metadata={"mimeType": PAINT_META_MIME})
    )


def _parse_tag(attr_text: str, inner: str) -> dict | None:
    """A completed tag's paintMeta dict, or None when it names no surface."""
    attrs = dict(_ATTR_RE.findall(attr_text))
    surface_id = attrs.get("surface")
    if not surface_id:
        logger.debug("dropped a <paint-title> tag with no surface attribute")
        return None
    meta: dict = {"surfaceId": surface_id}
    title = " ".join(inner.split())
    if title:
        meta["title"] = title
    kind = attrs.get("kind")
    if kind:
        meta["kind"] = kind
    return meta


def _possible_tag_start(text: str) -> int:
    """Index of the earliest suffix that could still become a shell tag
    (a partial opener at a chunk boundary, or an open tag whose close has not
    streamed yet); len(text) when nothing needs holding back."""
    idx = text.find("<")
    while idx != -1:
        rest = text[idx:]
        if any(rest.startswith(p) or p.startswith(rest) for p in _HOLD_PREFIXES):
            return idx
        idx = text.find("<", idx + 1)
    return len(text)


class PaintTitleTagFilter:
    """Streaming filter: strips complete shell tags out of prose chunks.

    feed() returns (clean_text, metas): the chunk's prose with tags removed, plus one
    meta dict per <paint-title> tag completed by this chunk. A completed <no-surface/>
    tag raises the `no_surface` flag instead of yielding a meta. Text that could still
    become a tag is held back until it resolves — a lone '<' releases as soon as the
    next characters rule the tag out; an open tag holds until its close arrives (its
    inner text is the title and never reaches the prose channel). flush() releases
    whatever never resolved, so a truncated stream loses no prose.
    """

    def __init__(self) -> None:
        self._buffer = ""
        self.no_surface = False

    def feed(self, text: str) -> tuple[str, list[dict]]:
        self._buffer += text
        out: list[str] = []
        metas: list[dict] = []
        while True:
            candidates = [
                m
                for m in (_TAG_RE.search(self._buffer), _NO_SURFACE_RE.search(self._buffer))
                if m
            ]
            if not candidates:
                break
            match = min(candidates, key=lambda m: m.start())
            out.append(self._buffer[: match.start()])
            if match.re is _TAG_RE:
                meta = _parse_tag(match.group(1), match.group(2))
                if meta:
                    metas.append(meta)
            else:
                self.no_surface = True
            self._buffer = self._buffer[match.end() :]
        held_at = _possible_tag_start(self._buffer)
        out.append(self._buffer[:held_at])
        self._buffer = self._buffer[held_at:]
        return "".join(out), metas

    def flush(self) -> str:
        held, self._buffer = self._buffer, ""
        return held


# --- Question policies (config-selected; the executor calls config.question_policy) ---


def require_carries_action(payload: list[dict], metas: dict[str, dict]) -> None:
    """A declared question must be answerable, per created surface (task-2.6 decision 15).

    Runs after validate_surface, feeding the same correction/retry loop. The structural
    marker-vs-root check has no counterpart in a catalog with no rare, purpose-built
    dialog component (where one root component fronts most surfaces regardless). What is
    checkable is semantic: a surface declared kind="question" must carry at least one
    action, or the user is asked something they have no way to answer. Raises ValueError
    naming the fix.
    """
    created: list[str] = []
    actionable: set[str] = set()
    for message in payload:
        if not isinstance(message, dict):
            continue
        create = message.get("createSurface")
        if isinstance(create, dict) and isinstance(create.get("surfaceId"), str):
            created.append(create["surfaceId"])
        update = message.get("updateComponents")
        if isinstance(update, dict):
            surface_id = update.get("surfaceId")
            for component in update.get("components") or []:
                if isinstance(component, dict) and _carries_action(component):
                    actionable.add(surface_id)
    for surface_id in created:
        declared = (metas.get(surface_id) or {}).get("kind") == QUESTION_KIND
        if declared and surface_id not in actionable:
            raise ValueError(
                f"surface '{surface_id}' is declared kind=\"question\" in its "
                "<paint-title> tag but carries no action, so the user cannot answer it. "
                "Give the question a Button with an `action`, or drop the kind attribute."
            )


def _carries_action(component: dict) -> bool:
    """Whether a component declares an action anywhere in its own properties.

    Shallow by design: an action nested inside a child component is that child's, and the
    child is its own entry in the same `components` list.
    """
    if isinstance(component.get("action"), dict):
        return True
    return any(
        isinstance(value, dict) and isinstance(value.get("action"), dict)
        for value in component.values()
    )


def require_root_component(name: str):
    """Marker <-> dialog consistency (task-8.5 decision 6), per created surface.

    Returns a policy for catalogs with a rare, purpose-built question component: a
    surface declared kind="question" must have a `name` root, and a `name`-rooted
    surface must be declared a question. Bidirectional by design — the consistency is
    the app's question idiom, not a canvas invariant (the client routes on the marker
    alone). Raises ValueError naming the fix.
    """

    def policy(payload: list[dict], metas: dict[str, dict]) -> None:
        created: list[str] = []
        roots: dict[str, str | None] = {}
        for message in payload:
            if not isinstance(message, dict):
                continue
            create = message.get("createSurface")
            if isinstance(create, dict) and isinstance(create.get("surfaceId"), str):
                created.append(create["surfaceId"])
            update = message.get("updateComponents")
            if isinstance(update, dict):
                surface_id = update.get("surfaceId")
                for component in update.get("components") or []:
                    if isinstance(component, dict) and component.get("id") == "root":
                        roots[surface_id] = component.get("component")
        for surface_id in created:
            declared = (metas.get(surface_id) or {}).get("kind") == QUESTION_KIND
            root = roots.get(surface_id)
            is_dialog = root == name
            if declared and not is_dialog:
                raise ValueError(
                    f"surface '{surface_id}' is declared kind=\"question\" in its "
                    f"<paint-title> tag but its root component is {root!r}, not "
                    f"'{name}'. A question surface must have a "
                    f"{name} root; either compose the question as a "
                    f"{name} or drop the kind attribute."
                )
            if is_dialog and not declared:
                raise ValueError(
                    f"surface '{surface_id}' has a '{name}' root but is "
                    'not declared kind="question". A question surface must be declared: '
                    f'emit <paint-title surface="{surface_id}" kind="question">…'
                    "</paint-title> before its <a2ui-json> block."
                )

    return policy
