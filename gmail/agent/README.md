# Gmail agent

An A2A agent for Gmail. It answers mail questions by painting A2UI surfaces with [`gmail-catalog`](../gmail-catalog/), Gmail's own components in Material 3's design language. It runs on port **11002** and is built on [`a2ui-agent-kit`](../../agent-kit/).

## What it can do

In `live` mode it works through Google's Gmail MCP server.

- **Reads** threads, messages, labels and drafts.
- **Saves drafts**, shown to you as a proposal first and saved only when you confirm.
- **Adds and removes labels**, and creates new ones, straight away.
- **Can't send mail**: the Gmail MCP server has no send tool.
- **Can't trash, mark as spam or delete** anything, its own drafts included.

It's allowed 12 of the server's tools: the reads, `create_draft`, and the label tools.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                | Needs                                                                     |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `deterministic` | canned answers, no model                 | nothing                                                                   |
| `stub`          | the model over canned mail               | `GOOGLE_API_KEY`                                                          |
| `live`          | the model over your mailbox, through MCP | `GOOGLE_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` |

`deterministic` answers any question with the signed-in account's recorded inbox digest, and replays the recorded actions: opening a thread, confirming or cancelling a draft, toggling a label. Opening a thread paints a new surface, as the live agent does.

Other flags: `--port`, `--host`, `--base-url`, the address the agent card advertises, and `--public-url`, the address the browser reaches its sign-in pages at — a tunnel address, when the browser is on another machine. `--state-dir` moves the sign-in store from `.state/`.

## Signing in

The agent is its own sign-in: A2UIVerse signs in to it, and it signs in to Google. Its card asks for three scopes, in the words A2UIVerse shows when it asks you:

| Scope      | Shown as                          | Asked                                     |
| ---------- | --------------------------------- | ----------------------------------------- |
| `inbox`    | See your inbox                    | at the first sign-in                      |
| `messages` | Read your email                   | the first time you open a message         |
| `organize` | Write drafts and label your email | the first time you save a draft or label  |

In `deterministic` and `stub` mode the sign-in offers two made-up accounts, each with its own mail: `you@example.com`, a developer's work mail, and `you.personal@example.net`, the same person's personal mail. In `deterministic` mode, opening a thread asks for `messages`, and confirming a draft or toggling a label asks for `organize`.

In `live` mode the sign-in sends you to Google. The agent keeps your Google token, refreshes it, and gives A2UIVerse a token of its own. It asks Google for `gmail.readonly` at first and `gmail.modify` for drafts and labels, with `openid`, `email` and `profile` to know who signed in.

### Setting up live sign-in

One-time, in a Google Cloud project. Gmail and Google Calendar share the project and its OAuth client.

1. **Create a Google Cloud project.**

2. **Join the [Google Workspace Developer Preview Program](https://developers.google.com/workspace/preview)** with that project. The Gmail MCP server is in preview; approval takes a couple of days.

3. **Enable the APIs:**

   ```bash
   gcloud services enable gmail.googleapis.com gmailmcp.googleapis.com \
     --project=<your-project-id>
   ```

4. **Set up the consent screen** (Google Auth Platform). Leave it in **Testing** and add each account that will sign in as a test user. Under Data Access add `gmail.readonly` and `gmail.modify`.

5. **Create an OAuth client** of type **Web application**. Under Authorized redirect URIs add the agent's finish address, `http://localhost:11002/sign-in/finish`, and Calendar's, `http://localhost:11003/sign-in/finish`. Behind a tunnel, add the address each agent runs at with `--public-url`, followed by `/sign-in/finish`, beside them.

6. **Put the client's ID and secret** in `.env` as `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`, and the same two in Calendar's `.env`.

> [!NOTE]
> While the client is in Testing, Google ends each sign-in after 7 days, and A2UIVerse asks you to sign in again. Publishing it needs Google's app verification and, because `gmail.readonly` and `gmail.modify` are restricted scopes, a security assessment.

## Test

```bash
uv run pytest
```

No model calls, no Gmail calls, no credentials needed.

## Recording

The stub's mail is written by hand, in the shapes Gmail's MCP server returns, one mailbox per made-up account in `app/fixtures/stub/<account>/`:

- `you`: a week of one developer's work mail, from the same people as the Calendar app's demo calendar.
- `personal`: the same week of the same person's personal mail, from people nowhere else in the demo.

The deterministic corpus is derived from beats the model paints over each mailbox, into `recordings/beats/<account>/` and `app/fixtures/deterministic/<account>/`, so nothing reaches Gmail. The beat driver signs in as the account you name:

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode stub --host localhost
uv run python scripts/record_beats.py --account <account> --model <model>
uv run python scripts/derive_corpus.py --account <account>
uv run pytest tests/test_corpus_is_publishable.py
```

**Recording live turns on pseudonymization.** With `A2UI_RECORD_DIR` set in `live` mode, every mail payload gets stand-in names and subjects before the model sees it, so no real mail reaches the recordings or the model provider. The stand-ins are seeded, so re-recording gives the same ones.

## Allowing more tools

The allowed tools are `GMAIL_TOOLS` in `app/mcp.py`; the ones held back are named in the comment under it. The sign-in's `gmail.modify` scope already covers trash and spam, so that list is what limits the agent.

To allow a tool, change these together:

1. Check its name and arguments against the server's live `tools/list`.
2. Add it to `GMAIL_TOOLS` in `app/mcp.py`, and take it out of the comment.
3. Update the pin in `tests/test_llm_mcp.py`.
4. Add it to the stub, `STUB_TOOLS` in `app/tools.py`, over hand-written data in the shape a live run returns.
5. Describe what it returns in `app/knowledge/gmail-domain.md`. For a write, add a proposal to the prompt, so it runs only when you confirm.

A tool that needs more than the sign-in asks Google for also needs a scope in `app/sign_in.py`: its words in `SCOPES`, its Google scopes in `GOOGLE_SCOPES`, and the tool in `tool_scopes`.

## Connecting to A2UIVerse

Launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only gmail` (add `--mode live` for your mailbox). The launcher starts the agent on the port its roster gives the app, the `default_port` in [`app/config.py`](app/config.py), packs the catalog with Stellify, and installs the app into the running A2UIVerse from the agent's card. `pnpm dev:all` starts A2UIVerse and the agents together.

When the platform records its canvas replays with this agent live, start the agent with `A2UI_RECORD_DIR` set, so real mail never reaches those recordings.
