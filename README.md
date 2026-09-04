# a2uiverse-apps

Vendor apps for [A2UIVerse](https://github.com/retz8/a2uiverse).

Each app is an **A2A agent** backed by its vendor's official public MCP server, painting its own UI with **A2UI**, packaged as an A2UIVerse app bundle. Together they exercise the thing the platform exists for: several vendors, each in its own look, composed onto one surface — none of them aware the others are there.

These apps depend on `@a2uiverse/sdk` and on the A2UI/A2A protocols. They never depend on anything else in the platform.

## The apps

| App         | Port    | Reads                  | Catalog            |
| ----------- | ------- | ---------------------- | ------------------ |
| `github/`   | `11001` | GitHub MCP (read-only) | `github-catalog`   |
| `gmail/`    | `11002` | Gmail MCP              | `gmail-catalog`    |
| `calendar/` | `11003` | Google Calendar MCP    | `calendar-catalog` |

Two kinds of catalog, deliberately: `github-catalog` is a full custom catalog over **Primer**, GitHub's real design system; the other two are the A2UI basic catalog under a product theme. The roster will keep both kinds — most apps will be the second, and the platform has to render them side by side without either bleeding into the other.

Every agent runs in **three modes**, on the same port:

| Mode            | What runs                   | Needs                         |
| --------------- | --------------------------- | ----------------------------- |
| `deterministic` | canned responses, no model  | nothing                       |
| `stub`          | the model over canned data  | a Gemini key                  |
| `live`          | the model over its real MCP | a key + the vendor credential |

The canned data in the first two is not hand-written — it is derived from recorded live payloads, which is what keeps it real-shaped.

## Running them

The platform's launcher starts all three, from the `a2uiverse` repo:

```bash
pnpm dev:agents                          # all three, deterministic
pnpm dev:agents --only gmail --mode live # one, live
```

Or run one by hand — each agent is its own uv project, and its `agent/README.md` covers setup, credentials, what it can and cannot do, and how to record fixtures:

```bash
cd gmail/agent && uv sync
uv run python -m app --mode deterministic  # canned fixtures, no model
uv run python -m app --mode stub           # model over canned tools
uv run python -m app --mode live           # model over the live MCP server
```

## Layout

One folder per app. Each folder is one installable app: its A2A agent, its catalog, and its manifest.

```
<vendor>/
  agent/              the A2A agent (Python, uv) — its own project
  <vendor>-catalog/   catalog.json + React implementation
  <manifest>          the app manifest, per @a2uiverse/sdk
```

The catalogs share one pnpm workspace with Turborepo over it; the agents sit outside it.

```bash
pnpm install    # fresh clone
pnpm verify     # build · typecheck · test · lint · format:check over every catalog
cd <vendor>/agent && uv run pytest   # an agent's own suite — no model calls, no credentials
```

Catalogs are consumed by the platform straight from this repo as git dependencies (`github:retz8/a2uiverse-apps#path:<vendor>/<vendor>-catalog`); nothing is published to a registry.

## Mock apps

Alongside the vendor apps, this repo holds **mock apps** in their own tier: agents invented so a platform mechanism can be exercised against data whose shape is known and controlled. A mock is built like any other app, but has no MCP behind it — its `live` mode runs the model over an in-repo dataset — and it is not part of the roster. Mocks are excluded from default launcher discovery and from the platform's registry, and are opted into explicitly, so the Router never retrieves over fictional vendors during ordinary work.

The tier is `mocks/`, one level below the repo root — which _is_ the quarantine, since discovery only reads the immediate subdirectories of the agents dir and `mocks/` carries no manifest of its own. Mocks take a port band of their own so they can never collide with a vendor, and so a scaffold's sibling-based port suggestion stays correct inside both the tier and the root.

| Mock      | Port    | Sells                            | Catalog          |
| --------- | ------- | -------------------------------- | ---------------- |
| `shop-a/` | `12001` | Aperture & Co, a boutique dealer | `shop-a-catalog` |
| `shop-b/` | `12002` | Northlight, an online retailer   | `shop-b-catalog` |

The pair exists for synthesis (milestone M2): two storefronts over one shared product shape, so a merge across them is correct by construction and every remaining hard thing is machinery. Their stock is a single authored artifact, [`mocks/dataset/products.json`](mocks/dataset/products.json), which both read — product identity is shared, while price, rating, stocked subset and listing order are each store's own. Every run mode is built from that file, so no two modes and no two stores can disagree about what a camera is.

Each store carries two instruments, one per half of the absent/invalid split: opening a camera makes the products array stop resolving (free, no re-synthesis), and sorting the catalogue writes the same cameras back in a new order (a generation bump, and a re-synthesis). Both are updates to a surface that already exists; neither creates one.

Being instruments rather than products, mocks are kept rather than deleted once the work that motivated them lands.

## Status

In development. The platform design lives in the `a2uiverse` repo's `SPEC.md`.
