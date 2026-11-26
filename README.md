# a2uiverse-apps

Apps for [A2UIVerse](https://github.com/retz8/a2uiverse): agents for GitHub, Gmail, Google Calendar, CircleCI and Linear that answer your questions with UI instead of text, each drawn in its product's own look. Beside them sit the kit they're built on, a scaffolder for new apps, and three mock stores.

**App = MCP server + Agentic BFF + A2UI catalog.** The vendor runs the MCP server, where your data lives. The **agent** is an [A2A](https://github.com/a2aproject/A2A) agent that takes a question, calls the MCP server, and answers with UI it generates in [A2UI](https://a2ui.org). The **catalog** is the A2UI components that UI is built from, in the product's look: the schema the agent writes against, and the React implementation a client draws it with.

## Run an app

Node 22 or newer, with pnpm through Corepack, and [uv](https://docs.astral.sh/uv/) for the agents.

```bash
cd linear/agent
uv sync
cp .env.example .env                        # the Gemini key the model modes need
uv run python -m app --mode deterministic   # canned answers, no model, port 11005
```

Every agent built on the kit runs in three modes, on the same ports: JSON-RPC and HTTP+JSON on its port, gRPC on its gRPC port, each at A2A 1.0 and 0.3. Its card lists the six paths in an order the app sets, and a client takes the first it speaks: the First path in the table of [what each agent is built with](#what-each-agent-is-built-with). Shop C, written by hand, has no modes and answers A2A 1.0 alone.

| Mode            | What answers                            | Needs                                                                      |
| --------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `deterministic` | canned answers, no model                | nothing                                                                    |
| `stub`          | the model, over canned data             | a Gemini key                                                               |
| `live`          | the model, over the vendor's MCP server | a Gemini key; for GitHub, Gmail and Calendar, an OAuth client you register |

The canned data is recorded from live runs, not written by hand. Other flags: `--port`, `--grpc-port`, `--host`, `--base-url` (the address the agent card advertises for JSON-RPC and HTTP+JSON), `--public-url` (the address the browser reaches the sign-in pages at) and `--state-dir` (where the sign-in store lives, in place of the agent's `.state/`).

From the `a2uiverse` repo, the launcher runs them all: `pnpm dev:all` for the apps and A2UIVerse together, `pnpm dev:agents` for the apps alone installed into a running A2UIVerse, `--only gmail,linear --mode live` for two apps live, `--tier mocks` for the two stores in place of the apps, `--publish --leave-uninstalled shop-b` for Shop B in the Store but not installed, for a question to offer it.

## Apps

| App                          | Answers about                                         | Catalog                                          | Port    | gRPC port |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------ | ------- | --------- |
| [GitHub](github/)            | repositories, issues, pull requests and notifications | Primer, GitHub's own design system               | `11001` | `11101`   |
| [Gmail](gmail/)              | your mail                                             | Gmail's own components in its Material 3 look    | `11002` | `11102`   |
| [Google Calendar](calendar/) | your calendar                                         | Calendar's own components in its Material 3 look | `11003` | `11103`   |
| [CircleCI](circleci/)        | your pipelines                                        | CircleCI's own components in its look            | `11004` | `11104`   |
| [Linear](linear/)            | your issues                                           | Linear's own components in its look              | `11005` | `11105`   |
| [Shop A](mocks/shop-a/)      | a mock camera store, Aperture & Co                    | the basic catalog, themed                        | `12001` | `12101`   |
| [Shop B](mocks/shop-b/)      | a mock camera store, Northlight                       | the basic catalog, themed                        | `12002` | `12102`   |
| [Shop C](mocks/shop-c/)      | a mock members' warehouse, Halide Supply              | the basic catalog                                | `12003` | `12103`   |

Every vendor app is backed by its vendor's official MCP server. Each app's README says what it covers, and its agent's README what it can and can't do.

The three **mock stores** exist for testing A2UIVerse. All three read one dataset, [`mocks/dataset/products.json`](mocks/dataset/products.json) — the same cameras, each store with its own prices, ratings and stock — so a merge across them is right by construction; they have no MCP server, and every answer, canned or the model's, comes from that file. They sit one level down, in `mocks/`. Shop A and Shop B are built like any app and run by A2UIVerse's launcher as a tier of their own. Shop C is written by hand in Go on the Go A2A SDK, with no kit and no A2UI library, and is started by hand.

### What each agent is built with

| App                          | Built on                 | A2A SDK         | A2A it answers                               | First path           | A2UI versions    | Catalog                               | Sign-in                | Data behind it               |
| ---------------------------- | ------------------------ | --------------- | -------------------------------------------- | -------------------- | ---------------- | ------------------------------------- | ---------------------- | ---------------------------- |
| [GitHub](github/)            | the agent kit, in Python | `a2a-sdk` 1.x   | 1.0 and 0.3, on JSON-RPC, HTTP+JSON and gRPC | gRPC at A2A 1.0      | `v0.9.1`         | custom                                | OAuth by redirect      | GitHub's MCP server          |
| [Gmail](gmail/)              | the agent kit, in Python | `a2a-sdk` 1.x   | 1.0 and 0.3, on JSON-RPC, HTTP+JSON and gRPC | HTTP+JSON at A2A 1.0 | `v0.9`           | custom                                | OAuth by redirect      | Google's Gmail MCP server    |
| [Google Calendar](calendar/) | the agent kit, in Python | `a2a-sdk` 1.x   | 1.0 and 0.3, on JSON-RPC, HTTP+JSON and gRPC | JSON-RPC at A2A 0.3  | `v0.9`, `v0.9.1` | custom                                | OAuth by redirect      | Google's Calendar MCP server |
| [CircleCI](circleci/)        | the agent kit, in Python | `a2a-sdk` 1.x   | 1.0 and 0.3, on JSON-RPC, HTTP+JSON and gRPC | JSON-RPC at A2A 1.0  | `v0.9`, `v0.9.1` | custom                                | OAuth by redirect      | CircleCI's MCP server        |
| [Linear](linear/)            | the agent kit, in Python | `a2a-sdk` 1.x   | 1.0 and 0.3, on JSON-RPC, HTTP+JSON and gRPC | HTTP+JSON at A2A 0.3 | `v0.9`           | custom                                | OAuth by redirect      | Linear's MCP server          |
| [Shop A](mocks/shop-a/)      | the agent kit, in Python | `a2a-sdk` 1.x   | 1.0 and 0.3, on JSON-RPC, HTTP+JSON and gRPC | JSON-RPC at A2A 1.0  | `v0.9`           | basic, themed                         | none                   | the mock stores' dataset     |
| [Shop B](mocks/shop-b/)      | the agent kit, in Python | `a2a-sdk` 1.x   | 1.0 and 0.3, on JSON-RPC, HTTP+JSON and gRPC | gRPC at A2A 0.3      | `v0.9.1`         | basic, themed                         | an API key in a header | the mock stores' dataset     |
| [Shop C](mocks/shop-c/)      | by hand, in Go           | `a2a-go` v2.8.0 | 1.0 alone, on gRPC, HTTP+JSON and JSON-RPC   | gRPC at A2A 1.0      | `v0.9.1`         | basic, the public one, nothing packed | OAuth by device code   | the mock stores' dataset     |

A custom catalog is the app's own components; a basic one is A2UI's basic catalog. The First path is the binding and the A2A version an agent's card lists first, the one a client takes.

The agent kit is [`a2ui-agent-kit`](agent-kit/) 0.2.0, on Python 3.14 or newer: `a2a-sdk` for A2A, from 1.3.0 below 2.0.0; `a2ui-agent-sdk` 0.12.1 and `a2ui-core` 0.7.1 for A2UI; Google ADK 2.x for the model, `gemini-3.8-flash` by default; Authlib for each agent's own sign-in server. No kit agent signs its card or serves a signed-in account a card of its own. Shop C has no model: it signs its card, and serves each member a card of their own.

## Signing in

Each vendor agent is its own sign-in: an OAuth authorization server A2UIVerse signs in to, declared on its card. A request without a token the agent issued is refused, HTTP 401 on JSON-RPC and HTTP+JSON and `UNAUTHENTICATED` on gRPC, and an action that needs more access than the account granted ends in A2A's `TASK_STATE_AUTH_REQUIRED`, `auth-required` to a caller on A2A 0.3, naming the missing scopes. The agent holds the vendor's token, and A2UIVerse only the agent's.

- **In `deterministic` and `stub` mode**, the sign-in page offers made-up accounts — Gmail has two, each with its own mail; the other apps one.
- **In `live` mode**, the sign-in sends you to the vendor. GitHub needs an OAuth App you register, Gmail and Calendar an OAuth client in a Google Cloud project, the two sharing it; Linear and CircleCI register themselves with the vendor on the first sign-in. Each agent's README has the steps.
- **When the browser is on another machine**, run the agent with `--public-url` set to the address the browser reaches it at, such as a tunnel's — its sign-in page, the account chooser's form and the address the vendor returns to — and register that return address at the vendor beside the `localhost` one. CircleCI's sign-in takes only a loopback return address, so CircleCI runs `live` without `--public-url`.

The mock stores differ: Shop B signs in with a key pasted on A2UIVerse's own page, Shop A has no sign-in, and Shop C signs in by device code on its own sign-in page, as one of two made-up members.

## Building a new app

[`create-a2ui-agent`](create-a2ui-agent/) scaffolds a whole app — agent, catalog and README — running before you edit anything:

```bash
pnpm install
pnpm --filter create-a2ui-agent build
pnpm exec create-a2ui-agent                 # asks for anything a flag didn't give
```

Every agent but Shop C is built on [`a2ui-agent-kit`](agent-kit/), which carries what the apps share — the A2A server, the three modes, sign-in, loading the catalog and checking the agent's UI against it, the prompt, and recording. An app keeps only what is its own: its agent card, prompt, tools, canned data, and what the model should know about the product.

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
| `shop-c`   | `12003` | none: nothing is packed       | `go run . token --member mara` in `mocks/shop-c/agent`                   |

The preview is the app's first screen on its Store listing, so it is taken in `deterministic` or `stub` mode, over canned data: the fake accounts sign in nowhere else. An agent running `live` is previewed from a `deterministic` run of the same checkout and published with the live agent's card URL; the card is the same in every mode, so the preview is at its version. When the card changes, move `version` in the agent's `app/config.py` to one the app has never published, or the marketplace refuses the publish. Stellify's README has every verb; A2UIVerse's launcher does all of this for the roster with `pnpm dev:all --publish`, `--mode live` included.

A publisher who runs A2UIVerse can publish from its Publish page instead, opened from the Apps button beside Trail: claim a name there, its token shown once, or sign in with the name and the token in Stellify's publisher file; then give it the app id, the card URL, the `dist/artifact` folder `pack` wrote and, when the card asks sign-in, the `preview.json` `preview` captured. Unpublishing is there too; `pack` and `preview` stay on the terminal.

## How an app meets A2UIVerse

- **The launcher** keeps a roster of the apps here, Shop C aside — each app's folder, its tier and its port — starts each agent on its port, builds its catalog package, packs it with Stellify, and installs the app from its agent's card, or publishes it and installs it from the marketplace under `--publish`, leaving uninstalled the apps `--leave-uninstalled` names. A new app joins the roster on the port it was scaffolded with. `A2UIVERSE_PUBLIC_URL`, a pattern with a `{port}` slot such as `https://<tunnel-id>-{port}.asse.devtunnels.ms`, gives each agent its `--public-url`; `--agent-state <dir>` gives each `--state-dir <dir>/<app id>`, keeping every sign-in store out of the checkout.
- **Sign-in.** A2UIVerse signs in to an agent by the scheme on its card, as any OAuth client would: it registers itself, opens the agent's sign-in page in a window of its own, and keeps the token the agent issues. It draws the sign-in itself; no app paints a password, code or card field. The card's `provider` and `documentationUrl` are where A2UIVerse sends a person to finish on the app's own side.
- **Found in the Store from a question.** A published app's card is what A2UIVerse's Planner reads when a question needs something no installed app can do: its name, publisher, description and skills with their examples. The slot that needs it offers the app by name and publisher, its description cut to two lines, with Install; once installed with nothing asked of it, the slot quotes the first skill's first example as something to ask. An app whose agent paints in a catalog its install doesn't hold says so in its slot: waiting on its publisher until the new version is published, then needs an update. A breaking catalog change can ship as a suggested update instead, through the kit's old catalog line ([agent-kit](agent-kit/README.md#shipping-a-breaking-catalog-change)).
- **The catalogs.** A2UIVerse compiles none of them in. Each is installed with its app, as the artifact Stellify packs, and A2UIVerse's client loads it at runtime and draws the app's UI with it inside the catalog's own Provider.
- **Paint titles and question marks**, the one thing an agent sends for A2UIVerse alone. With each surface it paints, the agent can give a short title, and a mark when the surface asks something, like "Send this reply?". The model writes them as a tag before the surface, and the kit sends them beside the A2UI as a `paintMeta` part, which any other client ignores. On A2UIVerse's canvas the title names the app's back and forward arrows, and the mark says on the progress line that the app needs your answer until you press inside it. Without them the app still works: the arrows read "Back", and a question goes unannounced. Every app here but Shop C sends both; `create-a2ui-agent --ecosystem` sets up a new app to.

## Working in this repo

```bash
pnpm install                        # the catalogs and create-a2ui-agent, one workspace
pnpm verify                         # build, typecheck, test and Stellify's check over all of them, every agent's tests, lint and format check
pnpm test:agents                    # every agent's own tests alone: no model calls, no credentials
cd linear/agent && uv run pytest    # one agent's tests
cd mocks/shop-c/agent && go test ./... # Shop C's tests, in Go
```

<details>
<summary><b>Layout</b></summary>

```
<app>/
  README.md             what the app covers: its MCP server, agent and catalog
  agent/                the A2A agent (Python), its own uv project
  <app>-catalog/        the A2UI catalog: schema, React implementation, Provider
agent-kit/              a2ui-agent-kit, the Python kit every agent but Shop C is built on
create-a2ui-agent/      the scaffolder for a new app
mocks/                  the three mock stores and their shared dataset; Shop C's agent in Go
```

</details>

## Feedback

These apps are part of A2UIVerse, which is in active development and isn't done. Feedback from anyone interested is welcome in the platform repo's [Discussions](https://github.com/retz8/a2uiverse/discussions); bugs in an app go to this repo's [issues](https://github.com/retz8/a2uiverse-apps/issues). [CONTRIBUTING](CONTRIBUTING.md) says more.

## License

MIT. See [LICENSE](LICENSE).

A2UIVerse is an independent project, not affiliated with or endorsed by GitHub, Google, Linear or CircleCI. Their product names identify the services the apps connect to and are trademarks of their owners.
