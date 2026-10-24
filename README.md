# a2uiverse-apps

Apps for [A2UIVerse](https://github.com/retz8/a2uiverse): agents for GitHub, Gmail, Google Calendar, CircleCI and Linear that answer your questions with UI instead of text, each drawn in its product's own look. Beside them sit the kit they're built on, a scaffolder for new apps, and two mock stores.

**App = MCP server + Agentic BFF + A2UI catalog.** The vendor runs the MCP server, where your data lives. The **agent** is an [A2A](https://github.com/a2aproject/A2A) agent that takes a question, calls the MCP server, and answers with UI it generates in [A2UI](https://a2ui.org). The **catalog** is the A2UI components that UI is built from, in the product's look: the schema the agent writes against, and the React implementation a client draws it with.

## Run an app

Node 22 or newer, with pnpm through Corepack, and [uv](https://docs.astral.sh/uv/) for the agents.

```bash
cd linear/agent
uv sync
cp .env.example .env                        # the Gemini key the model modes need
uv run python -m app --mode deterministic   # canned answers, no model, port 11005
```

Every agent runs in three modes, on the same port:

| Mode            | What answers                            | Needs                                                                      |
| --------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `deterministic` | canned answers, no model                | nothing                                                                    |
| `stub`          | the model, over canned data             | a Gemini key                                                               |
| `live`          | the model, over the vendor's MCP server | a Gemini key; for GitHub, Gmail and Calendar, an OAuth client you register |

The canned data is recorded from live runs, not written by hand. Other flags: `--port`, `--host`, `--base-url` (the address the agent card advertises), `--public-url` (the address the browser reaches the sign-in pages at) and `--state-dir` (where the sign-in store lives, in place of the agent's `.state/`).

From the `a2uiverse` repo, the launcher runs them all: `pnpm dev:all` for the apps and A2UIVerse together, `pnpm dev:agents` for the apps alone installed into a running A2UIVerse, `--only gmail,linear --mode live` for two apps live, `--tier mocks` for the two stores in place of the apps, `--publish --leave-uninstalled shop-b` for Shop B in the Store but not installed, for a question to offer it.

## Apps

| App                          | Answers about                                         | Catalog                                          | Port    |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------ | ------- |
| [GitHub](github/)            | repositories, issues, pull requests and notifications | Primer, GitHub's own design system               | `11001` |
| [Gmail](gmail/)              | your mail                                             | Gmail's own components in its Material 3 look    | `11002` |
| [Google Calendar](calendar/) | your calendar                                         | Calendar's own components in its Material 3 look | `11003` |
| [CircleCI](circleci/)        | your pipelines                                        | CircleCI's own components in its look            | `11004` |
| [Linear](linear/)            | your issues                                           | Linear's own components in its look              | `11005` |
| [Shop A](mocks/shop-a/)      | a mock camera store, Aperture & Co                    | the basic catalog, themed                        | `12001` |
| [Shop B](mocks/shop-b/)      | a mock camera store, Northlight                       | the basic catalog, themed                        | `12002` |

Every vendor app is backed by its vendor's official MCP server. Each app's README says what it covers, and its agent's README what it can and can't do.

The two **mock stores** exist for testing A2UIVerse's merged view. Both read one dataset, [`mocks/dataset/products.json`](mocks/dataset/products.json) — the same cameras, each store with its own prices, ratings and stock — so a merge across them is right by construction; they have no MCP server, and every answer, canned or the model's, comes from that file. They're built like any app and sit one level down, in `mocks/`, run by A2UIVerse's launcher as a tier of their own.

## Signing in

Each vendor agent is its own sign-in: an OAuth authorization server A2UIVerse signs in to, declared on its card. A request without a token the agent issued is answered 401, and an action that needs more access than the account granted ends in A2A's `auth-required`, naming the missing scopes. The agent holds the vendor's token, and A2UIVerse only the agent's.

- **In `deterministic` and `stub` mode**, the sign-in page offers made-up accounts — Gmail has two, each with its own mail; the other apps one.
- **In `live` mode**, the sign-in sends you to the vendor. GitHub needs an OAuth App you register, Gmail and Calendar an OAuth client in a Google Cloud project, the two sharing it; Linear and CircleCI register themselves with the vendor on the first sign-in. Each agent's README has the steps.
- **When the browser is on another machine**, run the agent with `--public-url` set to the address the browser reaches it at, such as a tunnel's — its sign-in page, the account chooser's form and the address the vendor returns to — and register that return address at the vendor beside the `localhost` one. CircleCI's sign-in takes only a loopback return address, so CircleCI runs `live` without `--public-url`.

The mock stores differ: Shop B signs in with a key pasted on A2UIVerse's own page, and Shop A has no sign-in.

## Building a new app

[`create-a2ui-agent`](create-a2ui-agent/) scaffolds a whole app — agent, catalog and README — running before you edit anything:

```bash
pnpm install
pnpm --filter create-a2ui-agent build
pnpm exec create-a2ui-agent                 # asks for anything a flag didn't give
```

Every agent is built on [`a2ui-agent-kit`](agent-kit/), which carries what the apps share — the A2A server, the three modes, sign-in, loading the catalog and checking the agent's UI against it, the prompt, and recording. An app keeps only what is its own: its agent card, prompt, tools, canned data, and what the model should know about the product.

## Publishing an app

An app reaches A2UIVerse's marketplace from its own checkout with [Stellify](https://github.com/retz8/a2uiverse/tree/main/packages/stellify), the catalog package's dev dependency: claim a publisher name once, then for each app pack its catalog, take its preview when its card asks sign-in, and publish.

```bash
cd linear/linear-catalog
pnpm exec stellify claim <name> --marketplace http://localhost:10002   # once; the token stays in your home directory
pnpm build && pnpm exec stellify pack                                  # writes dist/artifact/
# the agent running in deterministic mode, in another terminal
export STELLIFY_CREDENTIAL=$(cd ../agent && uv run python -m a2ui_agent_kit.preview_credential --url http://localhost:11005 --account me)
pnpm exec stellify preview linear http://localhost:11005/.well-known/agent-card.json dist/artifact
pnpm exec stellify publish linear http://localhost:11005/.well-known/agent-card.json dist/artifact --preview preview.json
```

| App id     | Port    | Catalog folder                | Preview credential                                                       |
| ---------- | ------- | ----------------------------- | ------------------------------------------------------------------------ |
| `github`   | `11001` | `github/github-catalog`       | `preview_credential --account retz8`                                     |
| `gmail`    | `11002` | `gmail/gmail-catalog`         | `preview_credential --account you`, or `personal`                        |
| `calendar` | `11003` | `calendar/calendar-catalog`   | `preview_credential --account you`                                       |
| `circleci` | `11004` | `circleci/circleci-catalog`   | `preview_credential --account retz8`                                     |
| `linear`   | `11005` | `linear/linear-catalog`       | `preview_credential --account me`                                        |
| `shop-a`   | `12001` | `mocks/shop-a/shop-a-catalog` | none: no sign-in, so the marketplace takes its preview itself at publish |
| `shop-b`   | `12002` | `mocks/shop-b/shop-b-catalog` | its demo key, `northlight-demo-key-4f7c2a`                               |

The preview is the app's first screen on its Store listing, so it is taken in `deterministic` or `stub` mode, over canned data: the fake accounts sign in nowhere else. An agent running `live` is previewed from a `deterministic` run of the same checkout and published with the live agent's card URL; the card is the same in every mode, so the preview is at its version. When the card changes, move `version` in the agent's `app/config.py` to one the app has never published, or the marketplace refuses the publish. Stellify's README has every verb; A2UIVerse's launcher does all of this for the roster with `pnpm dev:all --publish`, `--mode live` included.

A publisher who runs A2UIVerse can publish from its Publish page instead, opened from the Apps button beside Trail: claim a name there, its token shown once, or sign in with the name and the token in Stellify's publisher file; then give it the app id, the card URL, the `dist/artifact` folder `pack` wrote and, when the card asks sign-in, the `preview.json` `preview` captured. Unpublishing is there too; `pack` and `preview` stay on the terminal.

## How an app meets A2UIVerse

- **The launcher** keeps a roster of the apps here — each app's folder, its tier and its port — starts each agent on its port, builds its catalog package, packs it with Stellify, and installs the app from its agent's card, or publishes it and installs it from the marketplace under `--publish`, leaving uninstalled the apps `--leave-uninstalled` names. A new app joins the roster on the port it was scaffolded with. `A2UIVERSE_PUBLIC_URL`, a pattern with a `{port}` slot such as `https://<tunnel-id>-{port}.asse.devtunnels.ms`, gives each agent its `--public-url`; `--agent-state <dir>` gives each `--state-dir <dir>/<app id>`, keeping every sign-in store out of the checkout.
- **Sign-in.** A2UIVerse signs in to an agent by the scheme on its card, as any OAuth client would: it registers itself, opens the agent's sign-in page in a window of its own, and keeps the token the agent issues. It draws the sign-in itself; no app paints a password, code or card field. The card's `provider` and `documentationUrl` are where A2UIVerse sends a person to finish on the app's own side.
- **Found in the Store from a question.** A published app's card is what A2UIVerse's Planner reads when a question needs something no installed app can do: its name, publisher, description and skills with their examples. The slot that needs it offers the app by name and publisher, its description cut to two lines, with Install; once installed with nothing asked of it, the slot quotes the first skill's first example as something to ask. An app whose agent paints in a catalog its install doesn't hold says so in its slot: waiting on its publisher until the new version is published, then needs an update. A breaking catalog change can ship as a suggested update instead, through the kit's old catalog line ([agent-kit](agent-kit/README.md#shipping-a-breaking-catalog-change)).
- **The catalogs.** A2UIVerse compiles none of them in. Each is installed with its app, as the artifact Stellify packs, and A2UIVerse's client loads it at runtime and draws the app's UI with it inside the catalog's own Provider.
- **Paint titles and question marks**, the one thing an agent sends for A2UIVerse alone. With each surface it paints, the agent can give a short title, and a mark when the surface asks something, like "Send this reply?". The model writes them as a tag before the surface, and the kit sends them beside the A2UI as a `paintMeta` part, which any other client ignores. On A2UIVerse's canvas the title names the app's back and forward arrows, and the mark says on the progress line that the app needs your answer until you press inside it. Without them the app still works: the arrows read "Back", and a question goes unannounced. Every app here sends both; `create-a2ui-agent --ecosystem` sets up a new app to.

## Working in this repo

```bash
pnpm install                        # the catalogs and create-a2ui-agent, one workspace
pnpm verify                         # build, typecheck, test, Stellify's check, lint and format check over all of them
cd linear/agent && uv run pytest    # an agent's own tests: no model calls, no credentials
```

<details>
<summary><b>Layout</b></summary>

```
<app>/
  README.md             what the app covers: its MCP server, agent and catalog
  agent/                the A2A agent (Python), its own uv project
  <app>-catalog/        the A2UI catalog: schema, React implementation, Provider
agent-kit/              a2ui-agent-kit, the Python kit every agent is built on
create-a2ui-agent/      the scaffolder for a new app
mocks/                  the two mock stores and their shared dataset
```

</details>

## Feedback

These apps are part of A2UIVerse, which is in active development and isn't done. Feedback from anyone interested is welcome in the platform repo's [Discussions](https://github.com/retz8/a2uiverse/discussions); bugs in an app go to this repo's [issues](https://github.com/retz8/a2uiverse-apps/issues). [CONTRIBUTING](CONTRIBUTING.md) says more.

## License

MIT. See [LICENSE](LICENSE).

A2UIVerse is an independent project, not affiliated with or endorsed by GitHub, Google, Linear or CircleCI. Their product names identify the services the apps connect to and are trademarks of their owners.
