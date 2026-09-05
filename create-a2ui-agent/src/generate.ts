/**
 * The four files whose content varies by answers, generated in code (task-3.4 decision 4):
 * the agent config, the agent project file with the kit pin, the MCP wiring module, and the
 * manifest. Everything else is a template copy.
 */
import {catalogPackageName, pythonIdent, type ScaffoldAnswers} from './answers.js';
import {KIT_PACKAGE, KIT_REPO_URL, KIT_SUBDIRECTORY} from './kit.js';

const py = (s: string) => JSON.stringify(s);

export function agentPyproject(a: ScaffoldAnswers, kitRev: string): string {
  return `[project]
name = "a2ui-${a.id}-agent"
version = "0.1.0"
description = "The ${a.displayName} app's A2A agent, built on ${KIT_PACKAGE}."
readme = "README.md"
requires-python = ">=3.14"
dependencies = [
    "${KIT_PACKAGE}",
    "a2ui-agent-sdk>=0.2.4,<0.3.0",
    "a2a-sdk[http-server]>=0.3.0,<0.4.0",
    "google-adk>=2.5.0,<3.0.0",
    "python-dotenv>=1.0.0",
    "uvicorn>=0.40.0",
    "click>=8.1.8",
    "mcp>=1.28.1,<2.0.0",
]

[tool.uv]
package = false

# The kit, pinned to the commit these files were scaffolded against. Move the pin
# deliberately: the app's config, prompt prose, and tests follow the kit's surface at
# that commit.
[tool.uv.sources]
${KIT_PACKAGE} = { git = "${KIT_REPO_URL}", subdirectory = "${KIT_SUBDIRECTORY}", rev = "${kitRev}" }

[dependency-groups]
dev = [
    "pytest>=9.0.0",
    "pytest-asyncio>=1.3.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
pythonpath = ["."]
testpaths = ["tests"]
filterwarnings = [
    # Third-party: starlette's TestClient deprecates its httpx backend. Not our code.
    "ignore:Using \`httpx\` with \`starlette.testclient\` is deprecated",
]
`;
}

export function agentConfigPy(a: ScaffoldAnswers): string {
  const ident = pythonIdent(a.id);
  const policyImport = a.ecosystemReady
    ? 'from a2ui_agent_kit.paint_meta import require_carries_action\n'
    : '';
  const policyDef = a.ecosystemReady
    ? ''
    : `

def _no_question_policy(payload: list[dict], metas: dict[str, dict]) -> None:
    """This agent does not emit the paintMeta shell convention, so no declared question
    ever reaches this policy. Opt in by naming one of the kit's policies
    (\`a2ui_agent_kit.paint_meta\`) here and adding \`prose.SHELL_DESCRIPTION\` to the
    workflow blocks below.
    """
    return None
`;
  const workflow = a.ecosystemReady
    ? `    workflow_descriptions=(
        prose.WORKFLOW_DESCRIPTION,
        prose.SHELL_DESCRIPTION,
        prose.SCOPE_DESCRIPTION,
    ),`
    : `    workflow_descriptions=(
        prose.WORKFLOW_DESCRIPTION,
        prose.SCOPE_DESCRIPTION,
    ),`;
  const policy = a.ecosystemReady ? 'require_carries_action' : '_no_question_policy';

  return `"""The ${a.displayName} app's kit config — the whole per-vendor surface, stated once.

Everything the kit needs from this app is on this one object: identity, port, paths,
prompt prose, and the callables behind the three run modes. The kit never discovers a
config; \`app/__main__.py\` hands it this one.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.config import AgentAppConfig
${policyImport}
from app import prose
from app.card import APP_DESCRIPTION, APP_NAME, SKILLS
from app.responses import build_response, build_text_response
from app.tools import STUB_TOOLS

_AGENT_DIR = Path(__file__).resolve().parents[1]  # ${a.id}/agent/
_APP_PKG = Path(__file__).resolve().parent  # ${a.id}/agent/app/


def _live_toolset():
    # Deferred: app.mcp pulls google.adk, which deterministic and stub runs never pay for.
    from app.mcp import build_live_toolset

    return build_live_toolset()
${policyDef}

CONFIG = AgentAppConfig(
    name=APP_NAME,
    description=APP_DESCRIPTION,
    skills=SKILLS,
    default_port=${a.port},
    responder_app_name="a2ui_${ident}_live",
    adk_agent_name="a2ui_${ident}_live_agent",
    app_dir=_AGENT_DIR,
    catalog_path=_AGENT_DIR.parent / ${py(catalogPackageName(a.id))} / "catalogs" / "v0.9.1" / "catalog.json",
    catalog_kind=${py(a.catalogKind)},
    examples_dir=_APP_PKG / "knowledge" / "examples",
    role_description=prose.ROLE_DESCRIPTION,
${workflow}
    examples_framing=prose.EXAMPLES_FRAMING,
    brand_guidance_path=_APP_PKG / "knowledge" / "brand-guidance.md",
    domain_knowledge_path=_APP_PKG / "knowledge" / ${py(`${a.id}-domain.md`)},
    build_response=build_response,
    build_text_response=build_text_response,
    question_policy=${policy},
    stub_tools=STUB_TOOLS,
    live_toolset_factory=_live_toolset,
)
`;
}

export function agentMcpPy(a: ScaffoldAnswers): string {
  const name = a.displayName;
  if (a.googleAdc) {
    return `"""Live ${name} MCP toolset, with the kit's opt-in Google ADC credential block.

The credential is Application Default Credentials (\`a2ui_agent_kit.google_adc\`): minted
once by a developer outside the agent (\`gcloud auth application-default login\`), read and
refreshed by the library, never a client secret or a consent flow. Every failure fails
fast rather than degrading to canned data — the stub is only ever \`--mode stub\`.

TODO: set MCP_URL and SCOPES for ${name}'s MCP server, then delete the not-wired guard.
"""

from __future__ import annotations

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit import google_adc
from a2ui_agent_kit.google_adc import MissingGoogleCredentialError, mcp_headers
from a2ui_agent_kit.toolset import PolicyMcpToolset

__all__ = [
    "MCP_URL",
    "SCOPES",
    "LiveToolsetNotWiredError",
    "MissingGoogleCredentialError",
    "access_token",
    "build_live_toolset",
    "quota_project",
]

# TODO: the ${name} MCP server's streamable-HTTP endpoint.
MCP_URL = ""

# TODO: the OAuth scopes the credential must carry for that server.
SCOPES: tuple[str, ...] = ()

# Optional: pin the tool inventory client-side (\`tool_filter\`) once you know which of the
# server's tools this agent should hold. Empty means every tool the server exposes.
TOOL_FILTER: tuple[str, ...] = ()


class LiveToolsetNotWiredError(RuntimeError):
    """Raised by \`--mode live\` until MCP_URL and SCOPES are set."""


def quota_project() -> str:
    """The project billed for the call, sent as X-Goog-User-Project."""
    return google_adc.quota_project(${py(name)})


def access_token() -> str:
    """Mints a fresh access token from ADC, failing fast rather than degrading to canned data."""
    return google_adc.access_token(SCOPES, ${py(name)})


def build_live_toolset() -> PolicyMcpToolset:
    """Constructs the live MCP toolset. Construction is offline: the toolset stores its
    connection parameters and connects only when its tools are first listed."""
    if not MCP_URL or not SCOPES:
        raise LiveToolsetNotWiredError(
            "--mode live is not wired yet: set MCP_URL and SCOPES in app/mcp.py to "
            "${name}'s MCP server. Until then, run with --mode stub or --mode deterministic."
        )
    return PolicyMcpToolset(
        connection_params=StreamableHTTPConnectionParams(
            url=MCP_URL,
            headers=mcp_headers(access_token(), quota_project()),
        ),
        tool_filter=list(TOOL_FILTER) or None,
    )
`;
  }
  return `"""Live ${name} MCP toolset.

TODO: point MCP_URL at ${name}'s MCP server, supply its credential in \`headers\`, then
delete the not-wired guard. The credential comes from \`.env\` (see \`.env.example\`); the
agent never runs a consent flow of its own. Every failure fails fast rather than degrading
to canned data — the stub is only ever \`--mode stub\`.
"""

from __future__ import annotations

import os

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.toolset import PolicyMcpToolset

__all__ = ["MCP_URL", "LiveToolsetNotWiredError", "build_live_toolset", "headers"]

# TODO: the ${name} MCP server's streamable-HTTP endpoint.
MCP_URL = ""

# Optional: pin the tool inventory client-side (\`tool_filter\`) once you know which of the
# server's tools this agent should hold. Empty means every tool the server exposes.
TOOL_FILTER: tuple[str, ...] = ()


class LiveToolsetNotWiredError(RuntimeError):
    """Raised by \`--mode live\` until MCP_URL is set."""


def headers() -> dict[str, str]:
    """The request headers carrying the credential. TODO: match ${name}'s auth scheme."""
    token = os.environ.get("VENDOR_TOKEN")
    if not token:
        raise LiveToolsetNotWiredError(
            "VENDOR_TOKEN is not set. The live agent sends it as a bearer token on every "
            "${name} MCP call; set it in agent/.env. To run against canned fixture data "
            "instead, run with --mode stub."
        )
    return {"Authorization": f"Bearer {token}"}


def build_live_toolset() -> PolicyMcpToolset:
    """Constructs the live MCP toolset. Construction is offline: the toolset stores its
    connection parameters and connects only when its tools are first listed."""
    if not MCP_URL:
        raise LiveToolsetNotWiredError(
            "--mode live is not wired yet: set MCP_URL in app/mcp.py to ${name}'s MCP "
            "server. Until then, run with --mode stub or --mode deterministic."
        )
    return PolicyMcpToolset(
        connection_params=StreamableHTTPConnectionParams(url=MCP_URL, headers=headers()),
        tool_filter=list(TOOL_FILTER) or None,
    )
`;
}

export function manifestJson(a: ScaffoldAnswers, catalogId: string): string {
  const manifest = {
    $comment:
      "Placeholder until the sdk manifest schema lands (Phase 10); mirrors the orchestrator's registry record.",
    id: a.id,
    displayName: a.displayName,
    agent: {url: `http://localhost:${a.port}`, auth: 'none'},
    catalog: {id: catalogId, package: catalogPackageName(a.id)},
  };
  return JSON.stringify(manifest, null, 2) + '\n';
}
