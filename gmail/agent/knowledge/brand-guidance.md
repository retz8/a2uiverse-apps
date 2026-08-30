# Material 3 brand guidance

Rules for composing A2UI surfaces that read as genuine Gmail product UI, not merely schema-valid
trees. Per-component semantics already live in the catalog's own component descriptions; this doc
carries only the **cross-component, brand-level** rules the catalog cannot state — and only rules
that change what you emit. A rule the model would already follow earns no place here.

Register: imperative. Read each line as an instruction. Explanations appear only where the bare
rule would be ambiguous.

Scope: this catalog is the **basic catalog** — eighteen primitives, no product component library.
There is nothing to choose between: `Card` is the only container that reads as a surface, `Row` and
`Column` are the only layout. So the work is not selection, it is **assignment** — which primitive
plays which Material 3 role — and the theme does the rest. The tokens are already set for you: a
`Button` is a pill, a `Card` is a rounded raised surface, a `ChoicePicker` chip is a rounded chip.
You do not build those shapes; you choose what is a button, a card, a chip.

This doc holds no domain instructions (what a given screen should _say_) — only how to build it in
Material 3's visual language.

---

## The role each primitive plays

- **`Card` is the Material 3 surface container.** A list of threads, a thread's detail, a proposal —
  each is one `Card` on the page background. This is the card-on-lighter-ground that defines Gmail's
  current look; the theme supplies its radius and elevation.
- **Do not nest a `Card` inside a `Card`.** Two elevations stacked read as a bug, not a hierarchy.
  Inside a card, separate sections with a `Divider` or with spacing, never with another surface.
- **`Column` is the default container inside a card**; `Row` is for a line of peers — a sender beside
  a timestamp, a set of actions. Reach for `Column` first.
- **`List` is for repeated like items** — the threads in a digest, the messages in a thread. A
  handful of unlike blocks is a `Column`, not a `List`.
- **`ChoicePicker` is the Material 3 chip set.** Label filters, category switches and "which of
  these" questions are chips. Do not build a chip row out of `Button`s.
- **`Divider` separates; it does not decorate.** One between sections that are genuinely different.
  Never between every row of a list — the list's own spacing already separates them.
- **`Icon` is a leading visual, not an ornament.** An icon earns its place when it distinguishes one
  row from another; a decorative icon beside a heading is noise.

## A tappable row is a borderless `Button` wrapping the row

Only interactive components carry an `action` — `Row`, `Column`, `Card` and `List` do not. So a
list row that opens something is a `Button` with `variant: "borderless"` whose `child` is the
`Column` holding the row's content, and the action sits on the button. Putting an action on the
layout container is rejected by the catalog, and splitting the row into a label plus a separate
"open" button gives every row two hit targets where a mail client has one.

Inside a template, data-bind the action's event context by RELATIVE path —
`{"context": {"threadId": {"path": "id"}}}` — so every row carries its own target.

## Never root a surface in `Modal`

`Modal` in this catalog opens only from its own trigger child and holds its open state locally, so
**you cannot open it** — a surface rooted in one paints as a collapsed trigger and the user sees
nothing. It also paints fixed to the viewport, escaping the fragment's bounds and covering a canvas
it may be sharing with other apps.

A question is a `Card` like any other surface. The shell raises it and dims everything else; that
emphasis is the shell's job, not yours.

## Never fake a shape the theme already provides

The theme sets the pill button, the card radius and elevation, the rounded field and chip. Do not
compose extra structure to imitate them — no `Row` wrapping a `Text` to fake a chip, no nested
containers to fake a rounded edge. If a shape looks wrong, it is a theme bug, not something to work
around in the tree.

## Layout and density

- Give every surface a single root container with `id: "root"`. Never emit a bare leaf (a lone
  `Text`, `Button`) as the root.
- One screen, one subject. A digest lists threads; it does not also open one.
- Prefer a short list that is fully readable to a long one that needs scrolling. Ten threads is a
  digest; forty is a data dump.
- Set spacing with the container's own gap, never with empty spacer components.

## Typography

- Use exactly one heading-weight `Text` for the surface's primary title. Additional headings label
  genuine subsections.
- A thread row's **sender is the primary label** — semibold, first. The subject follows in normal
  weight, the snippet after it in the caption register. That order is the whole reason a mail list
  is scannable; reversing it makes every row look alike.
- Timestamps are secondary. Right-aligned in the row, never emphasised.
- Do not bold whole paragraphs of body text.

## Decompose a message body into components — never emit it as one `Text`

A mail body arrives as prose, often with structure: paragraphs, lists, quoted passages, links. There
is no markdown component. Its paragraphs become separate `Text` components, its bullets rows in a
`Column`, its links `Button`s where they act and plain text where they merely cite. Flattening a
body into a single string discards every bit of the sender's structure and produces a wall of prose
no reader scans. You are the renderer for that body.

## Actions

- A destructive or sending action is never the default-styled button. The confirming action of a
  proposal is the primary; everything else is secondary.
- An action that changes what is on screen must leave the user able to tell what changed. Do not
  repaint a whole digest to reflect one thread's label.
- Give every action a label that names the outcome — "Save draft", not "OK".
