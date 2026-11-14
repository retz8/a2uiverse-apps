# CLAUDE.md — a2uiverse-apps

## How to Use these Guides

> **INSTRUCTION FOR ALL AGENTS — do this before any task:**
>
> 1. **Read the platform design: `../a2uiverse/SPEC.md` in full.** This repo builds the apps that design composes; §4 (surface model), §8 (authority), §9 (apps, catalogs, store), and §13 (repositories) are the sections that bind this repo.
> 2. **For authoring, refactoring or reviewing TypeScript — a vendor catalog, a mock's catalog, the scaffolder `create-a2ui-agent`:** read [.claude/skills/coding-principles/SKILL.md](.claude/skills/coding-principles/SKILL.md) and follow its routing.
> 3. **For moving an app to a newer A2UI SDK or protocol version:** read [.claude/skills/a2ui-migration/SKILL.md](.claude/skills/a2ui-migration/SKILL.md) in full.
> 4. **For writing a README, a doc or a PR description:** read [.claude/skills/natural-writing/SKILL.md](.claude/skills/natural-writing/SKILL.md) in full.

This file (`CLAUDE.md`) holds only the **operational rules** not covered elsewhere.

`a2uiverse-apps` holds the **vendor apps** of A2UIVerse — all of them external apps; there are no internal agents. Each app is an A2A agent backed by its vendor's **official public MCP server**, painting its own UI with A2UI, installed into A2UIVerse from its agent's card with its catalog packed by Stellify, A2UIVerse's pack tool. A vendor catalog is its own component vocabulary in its vendor's design language, as GitHub's is Primer — very similar to the product without imitating it: no exact colors unless the vendor discloses them publicly, no product icons, no logos (`../a2uiverse/SPEC.md` §9.2). Shop A, Shop B and the scaffolder's `basic` template carry the themed basic catalog: the A2UI basic catalog under its `--a2ui-*` tokens, appending product components only for what the basic vocabulary cannot express. Every agent built on the kit runs in one of three modes, `deterministic`, `stub`, `live`, answering JSON-RPC and HTTP+JSON on its port and gRPC on its gRPC port, 100 above it. This repo is a **downstream consumer** of the A2UI and A2A protocols — not the protocol repo. The protocol, schemas, and standard catalogs live in the sibling fork at `../A2UI/`, which tracks `a2ui-project/a2ui` via its `upstream` remote. Read the spec from the `upstream/main` ref (see §2), not the fork's working tree.

### The one rule

> **An app may depend on `@a2uiverse/sdk` and the A2UI/A2A protocols, and its catalog package on Stellify at build time. It may never depend on anything else in the platform.**

No import, package, or path into `../a2uiverse/`; `@a2uiverse/sdk` is consumed as a published package, and Stellify as a `github:` dev dependency at a pinned commit, one pin across every catalog and the scaffolder's templates. An app reaches the platform only by being installed — its agent's card and its catalog artifact — and spoken to over A2A.

### Layout

One folder per app: `<vendor>/agent/` (the A2A agent, its own project) and `<vendor>/<vendor>-catalog/` (catalog schema + React implementation). Catalogs are packages of the root pnpm workspace, run with Turborepo. Vocabulary: a **catalog** is the package pairing a `catalog.json` with its framework implementation, named `<vendor>-catalog`; the **catalog schema** is the `catalog.json` and the **catalog implementation** the framework code that renders it, upstream's terms; an **adapter** is upstream's word for the framework layer only (`@a2ui/react` is the React adapter), never a catalog package here.

### Mock apps

A **mock app** is not a vendor app. It is an instrument — an agent authored so a platform mechanism can be exercised against data whose shape is known and controlled, rather than against a real vendor that may return anything.

A mock is shaped like any other app, Shop C aside: scaffolded by `create-a2ui-agent`, built on the kit, with an agent and a catalog. It differs in two ways.

- **No MCP.** There is no backend behind an invented vendor, so `live` means the model working over an in-repo dataset. The official-public-MCP rule above does not apply to mocks — and does not relax for anything else.
- **Not beside the vendor apps.** Mocks live in their own tier, outside the one-folder-per-app vendor layout, and A2UIVerse's launcher runs them only as that tier, in place of the vendor apps, so they are never installed beside them. The platform's Router retrieves over the installed apps' AgentCards; fictional vendors resident there would be noise in every composition it plans.

The tier is **`mocks/<id>/`**, mirroring the vendor layout one level down. Opting in is the launcher's mock tier (`--tier mocks`). Mocks take ports from **`12001+`**, a band of their own, so a mock and a vendor can never collide and the scaffold's sibling-based port suggestion stays correct in both places. A mock built on the kit takes it as a **path dependency**, as the vendor apps do, rather than the scaffold's git pin — an in-repo app on a pinned commit could not exercise a kit change until it was pushed, and the mocks are the tier that finds those changes first.

**Shop C** (`mocks/shop-c/`) is the mock written by hand: an agent alone, in Go on the Go A2A SDK (`a2a-go`), with no kit, no catalog package and no A2UI library. It answers A2A 1.0 alone on gRPC, HTTP+JSON and JSON-RPC, has no run modes, paints in the public basic catalog, and is its own authorization server. The launcher does not run it: it is started, installed and published by hand, as its agent's README says. Its gates are `gofmt`, `go vet` and `go test` in `mocks/shop-c/agent/`, CI's `go` job.

Mocks are kept rather than deleted once the work that motivated them lands: they are the only substrate where a mechanism can be re-tested against data guaranteed to be well-formed.

---

## 1. What is A2UI?

**A2UI (Agent-to-User Interface)** is a platform-agnostic, streaming-first UI protocol designed to let LLMs and autonomous agents generate user interfaces.

Key capabilities:

- **Streaming UI:** Progressive rendering of components and values on the fly to minimize latency.
- **Two-Way Data Binding:** Seamless state synchronization between client and agent.
- **Local Function Evaluation:** Execution of validation/logic functions registered in Component Catalogs.

---

## 2. Protocol Versioning & Authority

This project targets a single protocol version at a time.

- **Authority Rule:** Default to version **v0.9.1** as the primary authority, unless the user specifies otherwise.
- **Refresh the spec:** Include the phrase **"sync spec"** in your prompt. A `UserPromptSubmit` hook (`.claude/hooks/sync-spec-hook.sh`, wired in `.claude/settings.json`) runs a non-destructive `git fetch upstream` that updates the `upstream/main` ref without touching the fork's working tree or branch.
- Do not hardcode schema contents; read them from the `upstream/main` ref dynamically.
- **How to read the spec.** From the `upstream/main` ref of `../A2UI`, never its working tree, which is usually on a feature branch:
  - list a tree: `git -C ../A2UI ls-tree -r --name-only upstream/main specification/`
  - read a file in full: `git -C ../A2UI show upstream/main:specification/v0_9_1/json/server_to_client.json`
  - search: `git -C ../A2UI grep <pattern> upstream/main -- specification/`
- **Critical sources of truth** under `specification/<version>/`, each read in full for the targeted version: the JSON schemas (`json/server_to_client.json` for stream envelopes, `client_to_server.json` for action events, `common_types.json` for the dynamic binding primitives and the other `$defs`); the catalogs (`catalogs/<name>/catalog.json`, bundled under the version for v0.9 and v0.9.1 and under the repo's `catalogs/` from v1.0; the basic catalog is the structural reference when authoring one); the protocol semantics (`docs/a2ui_protocol.md`); the SDK architecture (`docs/sdks_spec.md`: the core SDK, the inference SDK, the framework adapters); the basic catalog implementation guide (`docs/basic_catalog_implementation_guide.md`); custom functions (`docs/a2ui_custom_functions.md`); the conformance suite (`test/`) the sdk's validator is measured against.

---

## 3. Conventions

- **No guessed run commands:** Consult the local `README.md` of each app for build/run/test steps rather than assuming a sequence.
- **No disposition popups — always plain chat.** Never use the `AskUserQuestion` tool to present dispositions, decisions, or choices. Lay out the options, tradeoffs, and a recommendation as plain chat text so the user keeps full flexibility to respond however they want.
- **Local only.** Every app runs as a local process in its own terminal. Nothing in this project is deployed.
- **Credential-collecting components are not in any catalog.** No password, card, or OTP input. Auth is declared on the AgentCard (`securitySchemes`) and painted by the platform, never by an app.
- **READMEs are a DX product.** A README is a doc for a human — concise but understandable and easy to read, not a complex dev doc. Its shape: what the package is, in one line; a quick start that works in a minute; the commands or the API, one line each; the details below in short sections or collapsed; the _why_ pointed at the platform's design records (`../a2uiverse/docs/design/`), never restated.

Catalog-authoring and renderer conventions live in the `coding-principles` skill's TypeScript subskills — A2UIVerse's own in `.claude/skills/coding-principles/subskills/typescript/a2uiverse-catalog-conventions.md` — and the component design flow in `design-catalog-component` and `build-catalog-component`.

### Setup and gates

- **Fresh clone:** `pnpm install` at the root (Node ≥ 22; Corepack resolves the pinned pnpm). Each app's agent is its own project — follow that app's README for its setup (e.g. `uv sync` for a Python agent, Go 1.26 for Shop C).
- **Gates:** `pnpm verify` — `turbo run build typecheck test check` over every `*/*-catalog`, `check` being Stellify's gate over the built catalog, then `eslint .` and `prettier --check .`. Agent test suites run per that app's README. Must be green before any commit that touches code lands on `main`. A commit that touches only documents — `_dev/`, READMEs, this file — needs only `prettier --check` on the files it changes.

### Daily-work harness

This repo is planned from the platform TODO: `../a2uiverse/_dev/TODO.md` is the single phase ladder. There is no separate TODO here. Sub-tasks whose code lands in this repo carry an `[apps]` tag there.

- **`[apps]` sub-tasks are worked directly on `main` of this repo** — no worktree, no sub-task branch — from a session rooted in `../a2uiverse/` with this repo as an additional working directory.
- **Specs, plans, and handoffs live in `../a2uiverse/_dev/docs/`.** `_dev/docs/` here holds only repo-local docs (e.g. `tunnel-environment.md`).
- **Nightly routine.** `a2uiverse-apps nightly producing routine` (Claude cloud Routine, 05:00 KST, Opus) drains `autonomous-ready` issues into labelled PRs per the harness's autonomous contract; triage with `daily-work-harness:review-nightly` from `../a2uiverse/`. Labels are provisioned on the repo.
- **Commit convention:** conventional commits — `<type>(phase-<N>): …` for phase/sub-task work, bare `<type>: …` off-phase.

---

## 4. Maintenance & Update Policy

- **`../a2uiverse/SPEC.md` is the source of truth for design.** When a design decision changes, it changes there — not in this file.
- Keep this file synchronized with the targeted protocol version as the project evolves. The skills copied from upstream (`a2ui-migration`, `coding-principles`, `natural-writing`) each open with a provenance line naming the upstream path and commit; refresh one by re-copying it from upstream, keeping A2UIVerse's own additions apart from the copy.
- When the targeted A2UI version changes, update the Authority Rule in this file.
- Suggest documentation updates to the user at the end of a task if any change affects documented files.
