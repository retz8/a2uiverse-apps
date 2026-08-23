# Tunnel environment

Instead of `localhost:<port>`, use the tunnel URL:
`https://vnw20xbg-<port>.asse.devtunnels.ms`. This applies to every URL the
browser touches and every server URL the platform is configured with.

This setup is only for Jioh In (@retz8); it does not apply to anyone else
working with this repo.

## Rules

- **Vendor agents are reached by the orchestrator on `localhost`** and are not
  tunnelled. The browser never talks to an agent directly.
- When an agent *is* tunnelled (direct-vs-hub comparison only), run it with its
  public **base URL set to its tunnel URL** so the agent card advertises an
  endpoint the caller can reach. With a `localhost` default the card fetch
  succeeds but the `message/send` POST targets an unreachable host.
- Jioh forwards the ports in play and sets them **Public** manually at the
  start of a session. If you see `Failed to fetch` (or `401`/`404`/`502` at the
  tunnel), suspect a non-public or unforwarded port before debugging the app —
  ask Jioh to check the port.
- First visit to a tunnel host shows a one-time "you are connecting to a dev
  tunnel" interstitial — click **Continue**.
- Servers must allow `localhost` and `*.devtunnels.ms` in CORS.
- Claude-in-Chrome always drives tunnel URLs, never `localhost` — the
  controlled browser is on the remote side.

## Ports

Vendor agents take `11001+` sequentially, one port per app regardless of run
mode (`deterministic` · `llm` · `llm` without MCP). Keep this table current.

| App | Port |
|---|---|
| github | 11001 |
| gmail | 11002 |
| google-calendar | 11003 |

## Run commands

Added per app as each lands; consult the app's `README.md` for the flag that
sets its base URL.
