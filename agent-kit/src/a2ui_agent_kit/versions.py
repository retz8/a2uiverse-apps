"""The kit's single home for the wire version tag.

The A2UI DataPart version tag as it rides the A2A wire ("v0.9") is the client's inline
`version` field — the tag of the v0.9.x message-format family, distinct from both the
SDK's internal schema-version constants (`a2ui.schema.constants.VERSION_0_9` = "0.9",
`VERSION_0_9_1` = "0.9.1") and the AgentCard extension URI (which advertises v0.9.1).
"""

WIRE_VERSION = "v0.9"
