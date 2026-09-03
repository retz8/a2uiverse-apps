"""a2ui-agent-kit — a kit for building A2UI+A2A agents.

Protocol-plain: an agent built on this kit speaks A2UI and A2A and nothing else.
The kit adds tooling around the protocols — A2A server wiring, the
deterministic|stub|live run modes, the wire recorder and beat pipeline, catalog
loading/validation, prompt assembly, the per-call toolset policy seam. The one
optional extra is `paint_meta`, a degradable shell convention an agent takes only
if it wants to (agents that never emit it compose unchanged).

Vendor-agnostic by contract: shared logic only. Everything vendor-specific —
fixtures, prompt prose, tool policy, the agent card — lives in the app and
reaches the kit through its AgentAppConfig (see `a2ui_agent_kit.config`).

Unofficial and downstream of google/a2ui: not part of the A2UI project itself.
"""
