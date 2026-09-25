# create-a2ui-agent

Scaffolds a new app on [`a2ui-agent-kit`](../agent-kit/): an A2A agent that answers with UI it generates in A2UI, its A2UI catalog, and the app manifest. The result has the same shape as the apps in this repo, and it runs before you edit anything.

```
<id>/
  README.md           the app: what it covers, its MCP server, agent and catalog
  agent/              the A2A agent (Python, uv): deterministic, stub or live
  <id>-catalog/       the A2UI catalog: schema, React implementation, Provider
  manifest.json       the app manifest
```

## Use

From this repository (the CLI is a workspace package; nothing is published):

```bash
pnpm install
pnpm --filter create-a2ui-agent build
pnpm exec create-a2ui-agent                   # guided walkthrough, scaffolds ./<id>
pnpm exec create-a2ui-agent path/to/app --id acme-mail --catalog basic --yes
```

Every input is a flag, and anything missing is asked for. `--yes`, or a non-interactive terminal, takes the defaults and fails on any input that has none.

| Flag                               | Input                                                            | Default                              |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| `--id <id>`                        | kebab-case app id: folder, catalog package prefix, manifest id   | none                                 |
| `--display-name <name>`            | the product name                                                 | the id, title-cased                  |
| `--description <text>`             | one line for the agent card                                      | from the display name                |
| `--port <n>`                       | the agent's port                                                 | next above the sibling apps' ports   |
| `--catalog basic\|custom`          | the basic A2UI catalog under a theme, or a custom catalog        | `basic`                              |
| `--google-adc` / `--no-google-adc` | sign in to the MCP server with a Google login instead of a token | off                                  |
| `--ecosystem` / `--no-ecosystem`   | send the paint titles A2UIVerse's canvas uses (see below)        | off                                  |
| `--repo-url <url>`                 | the repository the app lives in                                  | the target folder's git origin       |
| `--kit-rev <sha>`                  | the kit commit to pin                                            | this checkout's newest pushed commit |
| `--install` / `--no-install`       | run `uv sync` and `pnpm install` after writing                   | asked; off with `--yes`              |

The agent depends on the kit as a git dependency pinned to one commit, so an app scaffolded at a given commit matches the kit at that commit. The CLI warns when the checkout has uncommitted or unpushed changes.

The catalog id is the URL of the generated `catalog.json` on `main` in the app's repository, written into `catalog.json`, `src/catalog-id.ts` and the manifest.

## What you get

- `deterministic` paints a greeting card, `stub` holds one placeholder tool, and `live` stops with a "not wired yet" message until `app/mcp.py` names the MCP server.
- `uv run pytest` in `agent/`, and `pnpm typecheck && pnpm test` in the catalog, pass.
- Everything only you can write is a `TODO`. `agent/README.md` lists where they are.

## Tests

```bash
pnpm --filter create-a2ui-agent test
```

Snapshot tests pin the generated file list and the four generated files. The scaffold-and-run test scaffolds both catalog kinds, points the agent at this checkout's `agent-kit/`, and runs the new agent's and catalog's tests, so a kit change that breaks new apps fails here. It needs `uv` and `pnpm` on the PATH, and is skipped with a warning without them.

## Layout

| Path                          | What it is                                                                  |
| ----------------------------- | --------------------------------------------------------------------------- |
| `src/cli.ts`                  | Flags, defaults, the walkthrough, the install step                          |
| `src/prompts.ts`              | The guided walkthrough (`@clack/prompts`)                                   |
| `src/scaffold.ts`             | Copies the templates and writes the generated files                         |
| `src/generate.ts`             | The four generated files: config, pyproject with the kit pin, mcp, manifest |
| `templates/app/`              | The app's own README                                                        |
| `templates/agent/`            | The agent, common to both catalog kinds                                     |
| `templates/agent-kind/`       | What differs per catalog kind: fixtures, examples, brand guidance, answers  |
| `templates/agent-google-adc/` | The `.env.example` for a Google login                                       |
| `templates/catalog/`          | The two catalog packages: `basic` and `custom`                              |

Templates are copied as they are, with `__TOKEN__` placeholders such as `__DISPLAY_NAME__` and `__PORT__` filled in.

## Connecting to A2UIVerse

The manifest is what [A2UIVerse](https://github.com/retz8/a2uiverse)'s launcher reads to find the agent and its port. `--ecosystem` has the agent give each surface it paints a short title, and mark a surface that asks something, the way A2UIVerse's canvas expects. The generated READMEs' own "Connecting to A2UIVerse" sections cover the rest.
