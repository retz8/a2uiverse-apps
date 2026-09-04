# agent/ — the Shop B app's A2A agent

uv-managed Python project, on port **12002** in every run mode. Built on
[`a2ui-agent-kit`](../../../agent-kit/), taken as a path dependency because this app lives in the
kit's own repo: the kit carries the servers, run modes, recorder, and catalog machinery; this
project carries what is Northlight's — prompt prose, tools, knowledge docs, and the agent card
(`app/`).

**This is a mock, not a vendor app.** There is no shop and no MCP behind it. It exists so
synthesis can be exercised against data whose shape is known and controlled, and it is
quarantined from the default roster — see [the tier's README](../../README.md) and the repo
CLAUDE.md. Its stock is the tier's shared dataset at [`mocks/dataset/products.json`](../../dataset/products.json),
which both mock stores read, so the two cannot disagree about what a camera is.

## Setup

```bash
uv sync
```

## Test

```bash
uv run pytest
```

Tests make zero LLM calls and zero vendor calls: prompt-assembly snapshot, validator, and the
executor against canned responses. No key or credential is needed to run the suite. The first
run writes `tests/golden/llm_system_prompt.skeleton.txt`; commit it, and refresh it deliberately
whenever the prompt framing changes.

## Run

One entrypoint, three modes:

```bash
uv run python -m app --mode deterministic   # no model; responses built from the dataset
uv run python -m app --mode stub            # model over the dataset, writes inert
uv run python -m app --mode live            # model over the dataset, writes kept
```

| Mode            | Needs            | The instruments                                   |
| --------------- | ---------------- | ------------------------------------------------- |
| `deterministic` | nothing          | work, exactly and repeatably                      |
| `stub`          | `GOOGLE_API_KEY` | inert: a sort is acknowledged and changes nothing |
| `live`          | `GOOGLE_API_KEY` | work: a sort reorders a listing the agent keeps   |

A mock has no vendor to stub out, so `stub` earns its place a different way: it is the mode where
the model paints but the instruments do nothing. There is no vendor credential in any mode.

Copy `.env.example` to `.env` first (`MODEL_NAME` defaults to `gemini-3.7-flash`).

## The surfaces, and why they are pinned

Two surfaces, and the ids and data paths are a contract rather than a style choice: a synthesis
wiring's refs address exactly them (task-4.6 decision 14).

| Surface  | Data model                                        |
| -------- | ------------------------------------------------- |
| `list`   | `/items`, an array of `{id, name, price, rating}` |
| `policy` | `/policy`, text, and no array at all              |

`app/prose.py` states the pins to the model, and `tests/test_pins.py` asserts it still does. How
either surface is laid out is left to the model, which is what keeps synthesis independent of
presentation.

## The instruments

Two things a shopper can do, each provoking one half of the absent/invalid split the phase turns
on:

- **Open a camera** replaces `list`'s data model with a `/detail` object, so the products array
  stops resolving on the surface a wiring's refs already point at. Going back restores it. A
  missing array is _absent_: cells degrade, no generation bumps, no re-synthesis.
- **Sort the catalogue** writes the same cameras back to `/items` in a new order. An array whose
  contents changed is _invalid_: the generation bumps and the composition re-synthesizes.

Neither creates a surface. Both are updates to the one `list` already is.

## What to fill in

| Where                                                                                            | What |
| ------------------------------------------------------------------------------------------------ | ---- |
| Nothing. The scaffold's seams are filled and its `app/mcp.py` and `app/fixtures/` are gone: a    |
| mock has no MCP, and every mode is built from the dataset rather than from fixture files         |
| (task-4.6 decision 4), so a deterministic response and a live tool cannot disagree about what an |
| instrument does.                                                                                 |

| Where                            | What it carries                                                                |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `app/dataset.py`                 | The tier's shared dataset, sliced for this store                               |
| `app/surfaces.py`                | The three trees and the message builders — the one place a surface is composed |
| `app/responses.py`               | Deterministic mode: an action or prompt to A2UI, built from the dataset        |
| `app/tools.py` + `app/store.py`  | The four tools both LLM modes hold, and the listing live mode keeps            |
| `app/prose.py`                   | The role, the scope, and the pins                                              |
| `app/card.py`                    | The skills, in a shopper's words                                               |
| `app/knowledge/shop-b-domain.md` | What a camera and a listing are, and what a request is deciding                |

### Serving a browser on another machine

`--base-url` sets the URL the agent card advertises (default `http://<host>:<port>`). Pass
the publicly reachable URL whenever the browser reaches the agent through a host other than
`localhost` — with the default, the card fetch succeeds but the `message/send` POST targets
the wrong host.

## Recording live runs

With `A2UI_RECORD_DIR` set, every conversation's streamed A2UI output is captured as the exact
batch sequence it was sent, one file per conversation; unset, the agent behaves identically and
writes nothing. `scripts/record_beats.py` drives scripted prompts against an armed agent and
finalizes each into a per-beat fixture under `recordings/beats/`.

Four beats: the catalogue paint, then the drill-down, the return, and the reorder, all chained
into one conversation. Beats 2 to 4 update the surface beat 1 created and create none of their
own — which the kit's recorder accepts, since the `createSurface` requirement sits on the beat
group rather than on every turn (task-4.6 decision 15).

Unlike a vendor app, the recorded corpus here feeds nothing back: the dataset is the authored
truth and the other modes are built from it directly. A recording is evidence of what the model
did with a controlled dataset, and nothing in it is personal.
