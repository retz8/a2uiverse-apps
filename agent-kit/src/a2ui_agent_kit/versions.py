"""The A2UI versions the kit speaks, and what the version a request is answered in decides.

An app names the versions it speaks in its config's `a2ui_versions`: `v0.9`, `v0.9.1`, or
both. Each request is answered in one of them, chosen as upstream's helper `a2ui-a2a` chooses:
the newest the request names that the app's card advertises, otherwise the app's newest
(a2uiverse task-20.9 decision 5). No response names the choice; the version stamp on every A2UI
message the agent sends carries it, and it decides which actions the agent takes (a2uiverse
task-19.4).

The kit writes its own A2UI part, the card's A2UI entries and its reading of a press in place
of `a2ui-a2a`, which requires `a2a-sdk` below 0.4.0, to the same mapping (a2uiverse task-20.9
decisions 1 and 4).
"""

from __future__ import annotations

from collections.abc import Sequence

from a2a.types import AgentCard, AgentExtension, Message, Part
from a2ui.core.schema import ProtocolVersion
from google.protobuf import struct_pb2
from packaging.version import Version

from a2ui_agent_kit.wire import data_part, part_data

# The A2UI extension's URIs, `.../a2ui/v0.9` and `.../a2ui/v0.9.1`, as upstream writes them.
A2UI_EXTENSION_BASE_URI = "https://a2ui.org/a2a-extension/a2ui"
A2UI_EXTENSION_DESCRIPTION = "Provides agent driven UI using the A2UI JSON format."
SUPPORTED_CATALOG_IDS_KEY = "supportedCatalogIds"

# An A2UI part's mark, by upstream's mapping: the older string for a message stamped v0.9.
A2UI_MIME_TYPE = "application/a2ui+json"
DEPRECATED_A2UI_MIME_TYPE = "application/json+a2ui"


def extension_uri(version: str) -> str:
    return f"{A2UI_EXTENSION_BASE_URI}/{version}"


# The versions the kit speaks, oldest first, each with the A2UI extension URI that names it
# on a card and in a request.
EXTENSION_URIS: dict[str, str] = {
    ProtocolVersion.V0_9.value: extension_uri(ProtocolVersion.V0_9.value),
    ProtocolVersion.V0_9_1.value: extension_uri(ProtocolVersion.V0_9_1.value),
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


def a2ui_extension(version: str, catalog_ids: Sequence[str], keyed: bool = False) -> AgentExtension:
    """The card's A2UI entry for `version`, naming the app's catalog ids, as upstream's card
    helper writes it; `keyed` puts the params under the version's key."""
    extension = AgentExtension(uri=extension_uri(version), description=A2UI_EXTENSION_DESCRIPTION)
    if catalog_ids:
        params = {SUPPORTED_CATALOG_IDS_KEY: list(catalog_ids)}
        extension.params.CopyFrom(_struct({version: params} if keyed else params))
    return extension


def _struct(value: dict) -> struct_pb2.Struct:
    struct = struct_pb2.Struct()
    struct.update(value)
    return struct


def _version_of(uri: str) -> str | None:
    """The version an A2UI extension URI names, when the kit speaks it."""
    return next((version for version, known in EXTENSION_URIS.items() if known == uri), None)


def requested_versions(context) -> list[str]:
    """The A2UI versions a request names, in its extension header and on its message."""
    requested = {
        uri for uri in getattr(context, "requested_extensions", None) or () if isinstance(uri, str)
    }
    message = getattr(context, "message", None)
    if message is not None:
        requested.update(message.extensions)
    return [version for uri in requested if (version := _version_of(uri)) is not None]


def advertised_versions(card: AgentCard) -> list[str]:
    """The A2UI versions the card advertises."""
    return [
        version
        for extension in card.capabilities.extensions
        if (version := _version_of(extension.uri)) is not None
    ]


def choose_version(context, card: AgentCard | None, versions: Sequence[str]) -> str:
    """The version a request is answered in.

    The newest version the request names that the card advertises; a request naming none of
    them, or an executor built without the app's card, takes the app's newest.
    """
    if card is not None:
        matched = set(requested_versions(context)) & set(advertised_versions(card))
        if matched:
            return max(matched, key=lambda version: Version(version.removeprefix("v")))
    return versions[-1]


def mime_type_for(version: str) -> str:
    """An A2UI part's mark, by upstream's mapping."""
    return DEPRECATED_A2UI_MIME_TYPE if version in ("v0.8", "v0.9") else A2UI_MIME_TYPE


def stamped_part(message: dict, version: str) -> Part:
    """The A2A part one A2UI message goes out in, stamped `version` over whatever version it
    carried, marked by upstream's mapping in its metadata's `mimeType` and in its `media_type`
    (a2uiverse task-20.9 decision 1)."""
    stamped = {"version": version, **{k: v for k, v in message.items() if k != "version"}}
    return data_part(stamped, mime_type_for(version))


def a2ui_messages(part: Part) -> list[dict]:
    """The A2UI messages a part holds by its content: one message object, or a bare list of
    them, each entry judged on its own. No mark is read, and a list wrapped as `{value: [...]}`
    is not read (a2uiverse task-20.9 decision 4)."""
    data = part_data(part)
    entries = data if isinstance(data, list) else [data]
    return [entry for entry in entries if isinstance(entry, dict) and "version" in entry]


def extract_action(message: Message | None, version: str) -> dict | None:
    """The A2UI action a message carries, when its stamp is one `version`'s schema admits.

    A message stamped any other version is not an action.
    """
    if message is None:
        return None
    admitted = _ADMITTED_ACTION_VERSIONS[version]
    for part in message.parts:
        for entry in a2ui_messages(part):
            action = entry.get("action")
            if entry.get("version") in admitted and isinstance(action, dict):
                return action
    return None
