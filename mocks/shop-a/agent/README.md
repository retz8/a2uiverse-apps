# Shop A agent

An A2A agent for Aperture & Co, an invented camera store. It answers shopping questions by painting A2UI surfaces with [`shop-a-catalog`](../shop-a-catalog/). It runs on port **12001** and is built on [`a2ui-agent-kit`](../../../agent-kit/).

There is no store and no MCP server behind it. Its stock is [`mocks/dataset/products.json`](../../dataset/products.json), which [Shop B](../../shop-b/) reads too.

## What it can do

- **Lists** the cameras in stock, each with its price and rating.
- **Opens** one camera in full, and goes back to the list.
- **Sorts** the list by price or rating.
- **Answers** shipping, returns and warranty questions.

It holds four tools, all over the dataset: `list_cameras`, `open_camera`, `sort_cameras` and `store_policy`.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                                         | Needs            |
| --------------- | ----------------------------------------------------------------- | ---------------- |
| `deterministic` | answers built from the dataset, no model                          | nothing          |
| `stub`          | the model over the dataset; a sort is acknowledged, nothing moves | `GOOGLE_API_KEY` |
| `live`          | the model over the dataset; a sort really reorders, until restart | `GOOGLE_API_KEY` |

`deterministic` answers any question with the catalogue, and a question about shipping, returns or warranty with the policy. Opening a camera, going back and sorting all update the catalogue in place.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises.

## Surfaces

Two surfaces, whose ids and data paths are fixed:

| Surface  | Data                                              |
| -------- | ------------------------------------------------- |
| `list`   | `/items`, an array of `{id, name, price, rating}` |
| `policy` | `/policy`, text                                   |

Opening a camera replaces `list`'s data with a `/detail` object, and going back restores `/items`. Sorting writes the same cameras back to `/items` in a new order. Neither creates a surface.

`app/prose.py` tells the model the ids and paths, and `tests/test_pins.py` checks it still does. How each surface is laid out is left to the model.

## Test

```bash
uv run pytest
```

No model calls and no credentials needed.

## Recording

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
```

One conversation: the catalogue, a camera opened, back to the list, then sorted cheapest first. Unlike a vendor app, the recordings don't feed the other modes, which are built from the dataset directly. A recording shows what the model did with it.

## Connecting to A2UIVerse

Launch the pair from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:all --agents-dir ../a2uiverse-apps/mocks`. The launcher finds the agent through the app's [`manifest.json`](../manifest.json) and starts it on the port listed there.

A2UIVerse's merged view points into `/items` on `list`, by camera id, so keep the surface ids and data paths as they are. Opening a camera takes this store's values out of the merged view until you go back; sorting reorders the list without changing what the merged view shows.
