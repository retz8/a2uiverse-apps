# create-a2ui-agent

Scaffolds a new vendor app on [`a2ui-agent-kit`](../agent-kit/): an **A2UI over A2A** agent, its
catalog package, and the app manifest — in the shape the roster uses, working before you edit
anything.

```
<id>/
  agent/              the A2A agent (Python, uv) — deterministic | stub | live
  <id>-catalog/       the A2UI catalog: schema + React implementation + Provider
  manifest.json       the app manifest
```

Unofficial and downstream of google/a2ui; not part of the A2UI project itself.

## Use

From this repository (the CLI is a workspace package; nothing is published):

```bash
pnpm install
pnpm --filter create-a2ui-agent build
pnpm exec create-a2ui-agent                   # guided walkthrough, scaffolds ./<id>
pnpm exec create-a2ui-agent path/to/app --id acme-mail --catalog basic --yes
```

Every input is a flag; anything missing is asked for. `--yes` (or a non-TTY stdin) takes the
defaults where one exists and fails on the rest.

| Flag                               | Input                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `--id <id>`                        | kebab-case app id: folder, catalog package prefix, manifest id          |
| `--display-name <name>`            | the product name (default: the id, title-cased)                         |
| `--description <text>`             | one line for the agent card                                             |
| `--port <n>`                       | the agent's port (default: next above the sibling manifests' ports)     |
| `--catalog basic\|custom`          | themed basic catalog, or a custom catalog shell with one seed component |
| `--google-adc` / `--no-google-adc` | wire the kit's Google ADC credential helper into `app/mcp.py`           |
| `--ecosystem` / `--no-ecosystem`   | emit the kit's paintMeta convention for the A2UIVerse canvas            |
| `--repo-url <url>`                 | the repository the app lives in (default: the target's git origin)      |
| `--kit-rev <sha>`                  | the kit commit to pin (default: HEAD, or its newest pushed ancestor)    |
| `--install` / `--no-install`       | run `uv sync` and `pnpm install` after writing                          |

The scaffolded agent depends on the kit as a git dependency pinned to a commit sha, so a
scaffold at a given commit is self-consistent with the kit at that commit. The CLI warns when
that HEAD is dirty or unpushed. The catalog id is the repo-path URL of the generated
`catalog.json` on `main`, written once into `catalog.json`, `src/catalog-id.ts`, and the
manifest.

## What a fresh scaffold does

- **deterministic** paints a greeting card; **stub** holds one placeholder tool over a small
  fixture; **live** fails fast with a "not wired yet" message until `app/mcp.py` names the MCP
  server.
- `uv run pytest` in `agent/` and `pnpm typecheck && pnpm test` in the catalog are green.
- Every seam the scaffold cannot fill is a `TODO` marker; `agent/README.md` lists them.

## Layout of this package

| Path                          | What it is                                                                  |
| ----------------------------- | --------------------------------------------------------------------------- |
| `src/cli.ts`                  | Flags, defaults, the walkthrough hand-off, the install step                 |
| `src/prompts.ts`              | The guided walkthrough (`@clack/prompts`)                                   |
| `src/scaffold.ts`             | Copies the template trees and writes the generated files                    |
| `src/generate.ts`             | The four generated files: config, pyproject with the kit pin, mcp, manifest |
| `templates/agent/`            | The agent tree common to both catalog kinds                                 |
| `templates/agent-kind/`       | Per-kind overlays: fixtures, examples, brand guidance, responses            |
| `templates/agent-google-adc/` | The ADC variant of `.env.example`                                           |
| `templates/catalog/`          | The two catalog packages: `basic` and `custom`                              |

## Tests

```bash
pnpm --filter create-a2ui-agent test
```

Snapshot tests pin the generated tree and the four generated files. The scaffold-and-run test
is the CLI–kit drift gate: it scaffolds both kinds, rewrites the kit pin to the working-tree
`agent-kit/`, and runs the generated agent's pytest plus the catalog's typecheck and tests. It
needs `uv` and `pnpm` on PATH and skips, with a warning, when either is missing.
