"""The A2UI versions the kit speaks, and what the version a request is answered in decides.

An app names the versions it speaks in its config's `a2ui_versions`: `v0.9`, `v0.9.1`, or
both. Each request is answered in one of them, chosen by a2ui-a2a's activation helper from
the extension URIs the request names and the app's card advertises. The chosen version is
stamped on every A2UI message the agent sends and decides which actions it takes
(a2uiverse task-19.4).
"""

from __future__ import annotations

from collections.abc import Sequence

from a2a.types import AgentCard, DataPart, Message, Part
from a2ui.a2a.extension import get_a2ui_extension_uri, try_activate_a2ui_extension
from a2ui.a2a.parts import create_a2ui_part
from a2ui.core.schema import ProtocolVersion

# The versions the kit speaks, oldest first, each with the A2UI extension URI that names it
# on a card and in a request.
EXTENSION_URIS: dict[str, str] = {
    ProtocolVersion.V0_9.value: get_a2ui_extension_uri(ProtocolVersion.V0_9),
    ProtocolVersion.V0_9_1.value: get_a2ui_extension_uri(ProtocolVersion.V0_9_1),
}
A2UI_VERSIONS: tuple[str, ...] = tuple(EXTENSION_URIS)

# The version the kit's fixtures and recorded messages are written in. The stamp writes the
# request's own version over it at send.
FIXTURE_VERSION = ProtocolVersion.V0_9.value

# The protocol version an app's catalog is read at: its schema, its validation and the
# protocol schemas the prompt shows the model. An app's catalog.json declares none.
CATALOG_VERSION = ProtocolVersion.V0_9

# The stamps each version's client-to-server schema admits on an action: v0.9's requires
# `v0.9`; v0.9.1's version is the enum of both.
_ADMITTED_ACTION_VERSIONS: dict[str, tuple[str, ...]] = {
    "v0.9": ("v0.9",),
    "v0.9.1": ("v0.9", "v0.9.1"),
}


def version_set(versions: Sequence[str]) -> tuple[str, ...]:
    """An app's versions in the kit's order, oldest first.

    Raises on a version the kit does not speak and on an empty set, naming what it got.
    """
    if isinstance(versions, str):
        raise ValueError(
            f"a2ui_versions is a list of versions, such as [{versions!r}], not {versions!r}"
        )
    unknown = [version for version in versions if version not in EXTENSION_URIS]
    if unknown:
        raise ValueError(
            f"a2ui_versions names {', '.join(repr(v) for v in unknown)}, which the kit does "
            f"not speak; it speaks {', '.join(A2UI_VERSIONS)}"
        )
    if not versions:
        raise ValueError(
            f"a2ui_versions is empty: name at least one of {', '.join(A2UI_VERSIONS)}"
        )
    return tuple(version for version in A2UI_VERSIONS if version in versions)


def choose_version(context, card: AgentCard | None, versions: Sequence[str]) -> str:
    """The version a request is answered in.

    a2ui-a2a's activation helper picks the newest version the request names that the card
    advertises and registers its URI as activated, so A2A names it back on the response.
    A request naming none of them, or an executor built without the app's card, takes the
    app's newest.
    """
    activated = try_activate_a2ui_extension(context, card) if card is not None else None
    return activated.value if activated is not None else versions[-1]


def stamped_part(message: dict, version: str) -> Part:
    """The A2A part one A2UI message goes out in, stamped `version` over whatever version it
    carried. Upstream's part helper takes the version too, so the part's MIME type follows
    upstream's mapping."""
    stamped = {"version": version, **{k: v for k, v in message.items() if k != "version"}}
    return create_a2ui_part(stamped, version=version)


def extract_action(message: Message | None, version: str) -> dict | None:
    """The A2UI action a message carries, when its stamp is one `version`'s schema admits.

    A data part stamped any other version is not an action.
    """
    if not message or not message.parts:
        return None
    admitted = _ADMITTED_ACTION_VERSIONS[version]
    for part in message.parts:
        root = part.root
        if isinstance(root, DataPart) and root.data.get("version") in admitted:
            action = root.data.get("action")
            if isinstance(action, dict):
                return action
    return None
