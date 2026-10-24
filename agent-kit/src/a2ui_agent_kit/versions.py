"""The kit's single home for the protocol versions it names.

The A2UI DataPart version tag as it rides the A2A wire ("v0.9") is the client's inline
`version` field — the tag of the v0.9.x message-format family, distinct from both the
protocol version the kit reads its catalogs at and the AgentCard extension URI (which
advertises v0.9.1).
"""

from a2ui.core.schema import ProtocolVersion

WIRE_VERSION = "v0.9"

# The protocol version an app's catalog is read at: its schema, its validation and the
# protocol schemas the prompt shows the model. An app's catalog.json declares none.
CATALOG_VERSION = ProtocolVersion.V0_9

# The A2UI extension version the agent card advertises.
EXTENSION_VERSION = ProtocolVersion.V0_9_1
