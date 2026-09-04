# CLAUDE.md — a2uiverse-apps

## How to Use these Guides

> **INSTRUCTION FOR ALL AGENTS — do this before any task:**
>
> 1. **Read the platform design: `../a2uiverse/SPEC.md` in full.** This repo builds the apps that design composes; §4 (surface model), §8 (authority), §9 (apps, bundles, store), and §13 (repositories) are the sections that bind this repo.
> 2. **For work on a catalog, an adapter, or a renderer:** also read [.claude/skills/a2ui-sdk-design/SKILL.md](.claude/skills/a2ui-sdk-design/SKILL.md) in full.

This file (`CLAUDE.md`) holds only the **operational rules** not covered elsewhere.

`a2uiverse-apps` holds the **vendor apps** of A2UIVerse — all of them external apps; there are no internal agents. Each app is an A2A agent backed by its vendor's **official public MCP server**, painting its own UI with A2UI, packaged as an A2UIVerse app bundle. A vendor catalog is the A2UI basic catalog themed through its `--a2ui-*` tokens to mimic the vendor's product (GitHub is the exception, on Primer). Every agent runs on one port in one of three modes: `deterministic`, `stub`, `live`. This repo is a **downstream consumer** of the A2UI and A2A protocols — not the protocol repo. The protocol, schemas, and standard catalogs live in the sibling fork at `../A2UI/`, which tracks `a2ui-project/a2ui` via its `upstream` remote. Read the spec from the `upstream/main` ref (see §2), not the fork's working tree.

### The one rule

> **An app may depend on `@a2uiverse/sdk` and the A2UI/A2A protocols. It may never depend on anything else in the platform.**

No import, package, or path into `../a2uiverse/`; `@a2uiverse/sdk` is consumed as a published package. An app reaches the platform only by being installed through its bundle and spoken to over A2A.

### Layout

One folder per app: `<vendor>/agent/` (the A2A agent, its own project), `<vendor>/<vendor>-catalog/` (catalog schema + React implementation), and the app manifest at the folder root. Catalogs are packages of the root pnpm workspace, run with Turborepo. Vocabulary (catalog / schema / implementation; "adapter" only for the framework layer) is defined in the `a2ui-sdk-design` skill.

### Mock apps

A **mock app** is not a vendor app. It is an instrument — an agent authored so a platform mechanism can be exercised against data whose shape is known and controlled, rather than against a real vendor that may return anything.

A mock is shaped like any other app: scaffolded by `create-a2ui-agent`, built on the kit, with an agent, a catalog, and a manifest. It differs in two ways.

- **No MCP.** There is no backend behind an invented vendor, so `live` means the model working over an in-repo dataset. The official-public-MCP rule above does not apply to mocks — and does not relax for anything else.
- **Not in the roster.** Mocks live in their own tier, outside the one-folder-per-app vendor layout, and are excluded from default launcher discovery and from the platform's default registry. They are opted into explicitly. The platform's Router retrieves over the AgentCards in the roster; fictional vendors resident there would be noise in every composition it plans.

The tier is **`mocks/<id>/`**, mirroring the vendor layout one level down. The depth is the quarantine: discovery reads the immediate subdirectories of the agents dir looking for a `manifest.json`, and `mocks/` has none, so its children are never reached. Opting in is pointing the agents dir at the tier. Mocks take ports from **`12001+`**, a band of their own, so a mock and a vendor can never collide and the scaffold's sibling-based port suggestion stays correct in both places. A mock in this repo takes the kit as a **path dependency**, as the vendor apps do, rather than the scaffold's git pin — an in-repo app on a pinned commit could not exercise a kit change until it was pushed, and the mocks are the tier that finds those changes first.

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
- **How to read the spec** (paths, git commands, critical source-of-truth files): see the `a2ui-sdk-design` skill's "Specifications Navigation".

---

## 3. Conventions

- **No guessed run commands:** Consult the local `README.md` of each app for build/run/test steps rather than assuming a sequence.
- **No disposition popups — always plain chat.** Never use the `AskUserQuestion` tool to present dispositions, decisions, or choices. Lay out the options, tradeoffs, and a recommendation as plain chat text so the user keeps full flexibility to respond however they want.
- **Local only.** Every app runs as a local process in its own terminal. Nothing in this project is deployed.
- **Credential-collecting components are not in any catalog.** No password, card, or OTP input. Auth is declared on the AgentCard (`securitySchemes`) and painted by the platform, never by an app.

Catalog-authoring and renderer-design conventions live in the `a2ui-sdk-design` skill (read per the top instruction before that work).

### Setup and gates

- **Fresh clone:** `pnpm install` at the root (Node ≥ 22; Corepack resolves the pinned pnpm). Each app's agent is its own project — follow that app's README for its setup (e.g. `uv sync` for a Python agent).
- **Gates:** `pnpm verify` — `turbo run build typecheck test` over every `*/*-catalog`, then `eslint .` and `prettier --check .`. Agent test suites run per that app's README. Must be green before any commit lands on `main`.

### Daily-work harness

This repo is planned from the platform TODO: `../a2uiverse/_dev/TODO.md` is the single phase ladder. There is no separate TODO here. Sub-tasks whose code lands in this repo carry an `[apps]` tag there.

- **`[apps]` sub-tasks are worked directly on `main` of this repo** — no worktree, no sub-task branch — from a session rooted in `../a2uiverse/` with this repo as an additional working directory.
- **Specs, plans, and handoffs live in `../a2uiverse/_dev/docs/`.** `_dev/docs/` here holds only repo-local docs (e.g. `tunnel-environment.md`).
- **Nightly routine.** `a2uiverse-apps nightly producing routine` (Claude cloud Routine, 05:00 KST, Opus) drains `autonomous-ready` issues into labelled PRs per the harness's autonomous contract; triage with `daily-work-harness:review-nightly` from `../a2uiverse/`. Labels are provisioned on the repo.
- **Commit convention:** conventional commits — `<type>(phase-<N>): …` for phase/sub-task work, bare `<type>: …` off-phase.

---

## 4. Maintenance & Update Policy

- **`../a2uiverse/SPEC.md` is the source of truth for design.** When a design decision changes, it changes there — not in this file.
- Keep this file and the `a2ui-sdk-design` skill synchronized with the targeted protocol version as the project evolves.
- When the targeted A2UI version changes, update the Authority Rule in both this file and the skill.
- Suggest documentation updates to the user at the end of a task if any change affects documented files.
