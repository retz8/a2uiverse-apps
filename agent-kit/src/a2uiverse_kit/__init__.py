"""a2uiverse-agent-kit — the shared A2UI+A2A runtime for a2uiverse vendor agents.

Vendor-agnostic by contract: shared logic only. Everything vendor-specific — fixtures,
prompt prose, tool policy, the agent card — lives in the app and reaches the kit
through its AgentAppConfig (see `a2uiverse_kit.config`).
"""
