# Tunnel environment

Instead of `localhost:<port>`, use the tunnel URL:
`https://vnw20xbg-<port>.asse.devtunnels.ms`. This applies to every URL the
browser touches and every server URL the platform is configured with.

This setup is only for Jioh In (@retz8); it does not apply to anyone else
working with this repo.

## Rules

- **Every app's A2A server** runs with its public **base URL set to its tunnel
  URL** so the agent card advertises an endpoint the caller can reach. With a
  `localhost` default the card fetch succeeds but the `message/send` POST
  targets an unreachable host.
- The platform (`../a2uiverse`) is pointed at each app's tunnel URL, never
  `localhost`.
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

Assigned per app as each lands; keep this table current.

| App | Port |
|---|---|
| — | — |

## Run commands

Added per app as each lands; consult the app's `README.md` for the flag that
sets its base URL.
