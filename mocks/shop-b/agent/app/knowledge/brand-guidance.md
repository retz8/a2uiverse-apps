# Shop B brand guidance

Rules for composing A2UI surfaces that read as genuine Shop B product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component
descriptions; this doc carries only the **cross-component, brand-level** rules the catalog cannot
state — and only rules that change what the model emits.

Register: imperative. Read each line as an instruction.

Scope: this catalog is the **basic catalog** — eighteen primitives, no product component library.
The work is not selection, it is **assignment** — which primitive plays which role in the product's
visual language — and the theme does the rest. You do not build shapes; you choose what is a
button, a card, a chip.

Northlight is a mock store: an instrument whose surfaces exist so a composition over two
stores can be looked at. Keep them plain and legible; there is no product brand to honour.

---

## The role each primitive plays

- **`Card` is the surface container.** Each view is one `Card` on the page background; the theme
  supplies its radius and elevation. Do not nest a `Card` inside a `Card`.
- **`Column` is the default container inside a card**; `Row` is for a line of peers. Reach for
  `Column` first.
- **`List` is for repeated like items.** A handful of unlike blocks is a `Column`, not a `List`.
- **`ChoicePicker` is the chip set.** Filters and "which of these" questions are chips; do not
  build a chip row out of `Button`s.
- **`Divider` separates; it does not decorate.** Never between every row of a list.

## A tappable row is a borderless `Button` wrapping the row

Only interactive components carry an `action`. A list row that opens something is a `Button`
with `variant: "borderless"` whose `child` is the `Column` holding the row's content. Inside a
template, data-bind the action's event context by RELATIVE path so every row carries its own
target.

## Never root a surface in `Modal`

`Modal` opens only from its own trigger child, so a surface rooted in one paints as a collapsed
trigger and the user sees nothing. A question is a `Card` like any other surface.

## Layout and density

- Give every surface a single root container with `id: "root"`. Never emit a bare leaf as the root.
- One screen, one subject.
- Set spacing with the container's own gap, never with empty spacer components.

## Actions

- The confirming action of a proposal is the primary button; everything else is secondary.
- Give every action a label that names the outcome — "Save draft", not "OK".

## The catalogue is one card

The stock list is a single `Card` holding a title, the sort controls, and the rows. There is no
second card and no page chrome around it: the surface may be one panel among several on a shared
canvas, so it never assumes it owns the screen.

## A row is the whole camera, and it opens

Each row is a borderless `Button` wrapping a `Row` of the camera's name, its price and its rating.
The action carries the row's own `id` by relative path. Do not put a separate "view" control at
the end of a row; the row is the control.

## Sorting is a pair of quiet controls, never a chip set

Price and rating are the two orderings. Render them as borderless buttons above the list, not as
a `ChoicePicker`: the picker's chips read as filters, and nothing leaves the list when it is
sorted.

## Figures stay figures

Price and rating are shown as the numbers the tool returned. Do not prefix, round, or format
them into strings, and do not add a currency word — the number is the fact, and a formatted
string cannot be compared with another store's.

## The detail view replaces the list, in place

Opening a camera repaints the same surface: the camera's name, its description, its two figures,
and one primary control back to the list. It is not a new surface and not a modal.
