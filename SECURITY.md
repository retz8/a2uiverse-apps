# Security

## Reporting a vulnerability

Report it privately through [GitHub's private vulnerability reporting](https://github.com/retz8/a2uiverse-apps/security/advisories/new), never in a public issue or discussion. Say what is affected, how to reproduce it, and what it lets someone do. Never include a real token or credential.

Reports are acknowledged as soon as the maintainer can; there is no fixed response time.

## Scope

This repo: the vendor apps' agents and catalogs, the agent kit, `create-a2ui-agent`, and the mock stores, including how an agent handles the vendor credentials it reads from its local `.env`. The platform (client, orchestrator, marketplace) lives in [a2uiverse](https://github.com/retz8/a2uiverse), which has its own policy.

The apps run as local processes and are not deployed anywhere. Only `main` is supported.
