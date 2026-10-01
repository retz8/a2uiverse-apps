# a2uiverse-apps

Apps for [A2UIVerse](https://github.com/retz8/a2uiverse): agents for GitHub, Gmail, Google Calendar, CircleCI and Linear that answer your questions with UI instead of text, each drawn in its product's own look. Beside them sit the kit they're built on, a scaffolder for new apps, and two mock stores.

## What an app is

An app answers a question with UI.

**App = MCP server + Agentic BFF + A2UI catalog**

- **Vendor's MCP server**, where your data lives. The vendor runs it; it isn't built here.
- **Agent**, an Agentic BFF: an [A2A](https://github.com/a2aproject/A2A) agent that takes a question, calls the MCP server, and answers with UI it generates in [A2UI](https://a2ui.org), a protocol for agents to generate UI.
- **Catalog**, the A2UI components that UI is built from, in the product's look: the schema the agent writes against, and the React implementation a client draws it with.

## Apps

| App                          | Answers about                                         | Catalog                                          | Port    |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------ | ------- |
| [GitHub](github/)            | repositories, issues, pull requests and notifications | Primer, GitHub's own design system               | `11001` |
| [Gmail](gmail/)              | your mail                                             | Gmail's own components in its Material 3 look    | `11002` |
| [Google Calendar](calendar/) | your calendar                                         | Calendar's own components in its Material 3 look | `11003` |
| [CircleCI](circleci/)        | your pipelines                                        | CircleCI's own components in its look            | `11004` |
| [Linear](linear/)            | your issues                                           | Linear's own components in its look              | `11005` |

Every app is backed by its vendor's official MCP server. GitHub's catalog is built on Primer, and each of the others is its own set of components in its product's look. Each app's README says what it covers, and its agent's README what it can and can't do.

## Running an app

Every agent runs in three modes, on the same port:

| Mode            | What answers                            | Needs                                    |
| --------------- | --------------------------------------- | ---------------------------------------- |
| `deterministic` | canned answers, no model                | nothing                                  |
| `stub`          | the model, over canned data             | a Gemini key                             |
| `live`          | the model, over the vendor's MCP server | a Gemini key and the vendor's credential |

The canned data is recorded from live runs, not written by hand.

```bash
cd linear/agent
uv sync
cp .env.example .env                        # the keys the model modes need
uv run python -m app --mode deterministic
```

## Building a new app

[`create-a2ui-agent`](create-a2ui-agent/) scaffolds a whole app: agent, catalog and README, running before you edit anything.

```bash
pnpm install
pnpm --filter create-a2ui-agent build
pnpm exec create-a2ui-agent                 # asks for anything a flag didn't give
```

Every agent is built on [`a2ui-agent-kit`](agent-kit/), which carries what the apps share: the A2A server, the three modes, loading the catalog and checking the agent's UI against it, the prompt, and recording. An app keeps only what is its own: its agent card, prompt, tools, canned data, and what the model should know about the product.

## Mock stores

Two invented camera stores, for testing A2UIVerse's merged view: [Shop A](mocks/shop-a/) (Aperture & Co, port `12001`) and [Shop B](mocks/shop-b/) (Northlight, port `12002`). Both read one dataset, [`mocks/dataset/products.json`](mocks/dataset/products.json): the same cameras, each store with its own prices, ratings and stock, so a merge across them is right by construction. They have no MCP server; every answer, canned or the model's, comes from that file.

They're built like any app and sit one level down, in `mocks/`. A2UIVerse's launcher runs them as a tier of their own, in place of the apps. From the `a2uiverse` repo:

```bash
pnpm dev:all --tier mocks   # the two stores in place of the apps
```

## Connecting to A2UIVerse

**The launcher.** A2UIVerse's launcher keeps a roster of the apps here — each app's folder, its tier and its port — and starts each agent on its port. It builds the app's catalog package, packs it with Stellify, and installs the app into A2UIVerse from its agent's card. A new app joins the roster on the port it was scaffolded with. From the `a2uiverse` repo:

```bash
pnpm dev:agents                                     # every app, deterministic, installed into the running A2UIVerse
pnpm dev:agents --only gmail,linear --mode live     # two apps, live
pnpm dev:all                                        # the apps and A2UIVerse together
```

**The catalogs.** A2UIVerse compiles none of them in. Each is installed with its app, as the artifact Stellify packs from the catalog package, and A2UIVerse's client loads it at runtime and draws the app's UI with it inside the catalog's own Provider.

**Paint titles and question marks.** The one thing an agent sends for A2UIVerse alone. With each surface it paints, the agent can give a short title, and a mark when the surface asks something, like "Send this reply?". The model writes them as a tag before the surface, and the kit sends them beside the A2UI as a `paintMeta` part, which any other client ignores. On A2UIVerse's canvas:

- **The title** names the app's back and forward arrows, so each says which screen it returns to.
- **The question mark** raises the app's slot and dims the rest of the screen until it's answered.

Without them the app still works: the arrows read "Back", and a question shows as an ordinary surface. Every app here sends both; `create-a2ui-agent --ecosystem` sets up a new app to.

## Working in this repo

Node 22 or newer, with pnpm through Corepack, and [uv](https://docs.astral.sh/uv/) for the agents.

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
