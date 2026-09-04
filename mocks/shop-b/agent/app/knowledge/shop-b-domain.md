# Shop B domain knowledge

What the objects in this domain are and what a person is deciding when they ask about one. Facts
and the decisions that hinge on them — never what a screen should contain.

Shop B is a **mock**: an instrument, not a vendor. There is no shop behind it. Its stock is the
mock tier's shared dataset, which two stores read so that a synthesis over them has a join that is
correct by construction. Nothing here is a real product or a real price.

---

## The objects

- **A camera** is the unit. It is identified by its `id`, which is stable and shared across both
  mock stores — the same `id` in either store is the same camera. `name` is the model name.
- **A listing** is one camera as _this_ store sells it: its `price` and its `rating`. Two stores
  can list the same camera at different prices and different ratings, and one store can stock a
  camera the other does not.
- `price` is a number in whole units of currency. `rating` is a number out of five. Both stay
  numbers on the surface: a formatted string cannot be compared across stores.

## What this store is

Northlight is a high-volume online retailer: whatever the warehouse holds today, at today's supplier price. A `rating` here is the average customer score.

The shelf is not the whole market. This store knows only its own stock and its own terms; it has
no view of any other shop's prices and must never guess at one.

## What a request is deciding

- **"What do you have?"** — the person is deciding what to consider. They need every camera in
  stock with the two figures they will compare on, not a subset chosen for them.
- **"Tell me about X"** — they have narrowed to one and want the detail behind the row.
- **"Cheapest / best rated first"** — they are choosing an ordering to decide in, not filtering.
  Nothing leaves the list.
- **"How do you ship / can I return it?"** — a question about terms, not about stock. It is
  answered from the store's policy and touches no camera.
