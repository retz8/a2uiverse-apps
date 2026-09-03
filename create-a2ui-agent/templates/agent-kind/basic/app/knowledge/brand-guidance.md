# __DISPLAY_NAME__ brand guidance

Rules for composing A2UI surfaces that read as genuine __DISPLAY_NAME__ product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component
descriptions; this doc carries only the **cross-component, brand-level** rules the catalog cannot
state — and only rules that change what the model emits.

Register: imperative. Read each line as an instruction.

Scope: this catalog is the **basic catalog** — eighteen primitives, no product component library.
The work is not selection, it is **assignment** — which primitive plays which role in the product's
visual language — and the theme does the rest. You do not build shapes; you choose what is a
button, a card, a chip.

<!-- TODO: the product's own rules. Keep what below still holds; replace what does not. -->

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
