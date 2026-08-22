# CLAUDE.md — a2uiverse-apps

## How to Use these Guides

> **INSTRUCTION FOR ALL AGENTS — do this before any task:**
>
> 1. **Read the platform design: `../a2uiverse/SPEC.md` in full.** This repo builds the apps that design composes; §4 (surface model), §8 (authority), §9 (apps, bundles, store), and §13 (repositories) are the sections that bind this repo.
> 2. **For work on a catalog, an adapter, or a renderer:** also read [.claude/skills/a2ui-sdk-design/SKILL.md](.claude/skills/a2ui-sdk-design/SKILL.md) in full.

This file (`CLAUDE.md`) holds only the **operational rules** not covered elsewhere.

`a2uiverse-apps` holds the **mock vendor apps** of A2UIVerse. Each app is an A2A agent that paints its own UI with A2UI, packaged as an A2UIVerse app bundle. This repo is a **downstream consumer** of the A2UI and A2A protocols — not the protocol repo. The protocol, schemas, and standard catalogs live in the sibling fork at `../A2UI/`, which tracks `a2ui-project/a2ui` via its `upstream` remote. Read the spec from the `upstream/main` ref (see §2), not the fork's working tree.

### The one rule

> **An app may depend on `@a2uiverse/sdk` and the A2UI/A2A protocols. It may never depend on anything else in the platform.**

No import, package, or path into `../a2uiverse/`; `@a2uiverse/sdk` is consumed as a published package. An app reaches the platform only by being installed through its bundle and spoken to over A2A.

### Layout

One folder per app: `<vendor>/agent/` (the A2A agent, its own project), `<vendor>/<vendor>-catalog/` (catalog schema + React implementation), and the app manifest at the folder root. Catalogs are packages of the root pnpm workspace, run with Turborepo. Vocabulary (catalog / schema / implementation; "adapter" only for the framework layer) is defined in the `a2ui-sdk-design` skill.

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

### Daily-work harness

This repo is planned from the platform TODO: `../a2uiverse/_dev/TODO.md` is the single phase ladder. There is no separate TODO here. Sub-tasks whose code lands in this repo carry an `[apps]` tag there.

- **`[apps]` sub-tasks are worked directly on `main` of this repo** — no worktree, no sub-task branch — from a session rooted in `../a2uiverse/` with this repo as an additional working directory.
- **Specs, plans, and handoffs live in `../a2uiverse/_dev/docs/`.** `_dev/docs/` here holds only repo-local docs (e.g. `tunnel-environment.md`).
- **Commit convention:** conventional commits — `<type>(phase-<N>): …` for phase/sub-task work, bare `<type>: …` off-phase.

---

## 4. Maintenance & Update Policy

- **`../a2uiverse/SPEC.md` is the source of truth for design.** When a design decision changes, it changes there — not in this file.
- Keep this file and the `a2ui-sdk-design` skill synchronized with the targeted protocol version as the project evolves.
- When the targeted A2UI version changes, update the Authority Rule in both this file and the skill.
- Suggest documentation updates to the user at the end of a task if any change affects documented files.
