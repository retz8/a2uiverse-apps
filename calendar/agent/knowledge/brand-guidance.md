# Material 3 brand guidance

Rules for composing A2UI surfaces that read as genuine Google Calendar product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component descriptions; this doc
carries only the **cross-component, brand-level** rules the catalog cannot state — and only rules
that change what you emit. A rule the model would already follow earns no place here.

Register: imperative. Read each line as an instruction. Explanations appear only where the bare
rule would be ambiguous.

Scope: this catalog is the **basic catalog** — eighteen primitives, no product component library.
There is nothing to choose between: `Card` is the only container that reads as a surface, `Row` and
`Column` are the only layout. So the work is not selection, it is **assignment** — which primitive
plays which Material 3 role — and the theme does the rest. The tokens are already set for you: a
`Button` is a pill, a `Card` is a ruled surface on a flat ground, a `ChoicePicker` chip is a
rounded chip. Calendar's theme is the **dense** one: its gaps, padding and type scale are tighter
than a reading surface's, because an agenda row carries a time, a title and a place in the height
a list of prose would give to two lines.
You do not build those shapes; you choose what is a button, a card, a chip.

This doc holds no domain instructions (what a given screen should _say_) — only how to build it in
Material 3's visual language.

---

## The role each primitive plays

- **`Card` is the Material 3 surface container.** An agenda, one event's detail, a proposal —
  each is one `Card` on the page background. Calendar's card is defined by its hairline rule, not
  by lift; the theme supplies that, and it is what keeps a dense agenda from reading as a stack of
  floating tiles.
- **Do not nest a `Card` inside a `Card`.** Two elevations stacked read as a bug, not a hierarchy.
  Inside a card, separate sections with a `Divider` or with spacing, never with another surface.
- **`Column` is the default container inside a card**; `Row` is for a line of peers — a title beside
  its time, a set of actions. Reach for `Column` first.
- **`List` is for repeated like items** — the events in an agenda, the guests on an event. A
  handful of unlike blocks is a `Column`, not a `List`.
- **`ChoicePicker` is the Material 3 chip set.** Day and range switches, and "which of these"
  questions, are chips. Do not build a chip row out of `Button`s.
- **A `ChoicePicker` carries no action.** It writes a choice into the data model; it cannot fire
  an event. So it fits a selection some later control commits, and never fits a control that must
  act on the press. An invitation's three answers act on the press, so they are three `Button`s —
  a chip set there would look right and do nothing.
- **`Divider` separates; it does not decorate.** One between sections that are genuinely different.
  Never between every row of a list — the list's own spacing already separates them.
- **`Icon` is a leading visual, not an ornament.** An icon earns its place when it distinguishes one
  row from another; a decorative icon beside a heading is noise.

## A tappable row is a borderless `Button` wrapping the row

Only interactive components carry an `action` — `Row`, `Column`, `Card` and `List` do not. So a
list row that opens something is a `Button` with `variant: "borderless"` whose `child` is the
`Column` holding the row's content, and the action sits on the button. Putting an action on the
layout container is rejected by the catalog, and splitting the row into a label plus a separate
"open" button gives every row two hit targets where an agenda has one.

Inside a template, data-bind the action's event context by RELATIVE path —
`{"context": {"eventId": {"path": "id"}}}` — so every row carries its own target.

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
- One screen, one subject. An agenda lists events; it does not also open one.
- Prefer a short list that is fully readable to a long one that needs scrolling. A day is an
  agenda; a month is a data dump.
- **Group an agenda by day, and label each group.** A flat list of times with no day boundaries is
  unreadable the moment it crosses midnight. One day needs no grouping.
- Set spacing with the container's own gap, never with empty spacer components.

## Typography

- Use exactly one heading-weight `Text` for the surface's primary title. Additional headings label
  genuine subsections.
- An agenda row's **time is the primary label** — semibold, first, and in a fixed-width position
  so the times form a column the eye runs down. The title follows in normal weight, the place or
  the guest count after it in the caption register. This is the inverse of a mail list, where the
  correspondent leads: a person scans a calendar by _when_, and a row that leads with its title
  makes the one thing they are looking for the thing they have to hunt for.
- An all-day event has no time to lead with. Give it the day's group label and no time column
  entry — never a fabricated "12:00 AM".
- Do not bold whole paragraphs of an event's notes.

## Decompose an event's notes into components — never emit them as one `Text`

An event's description arrives as prose, often with structure: an agenda, a list of links, dial-in
details, a paragraph of context. There is no markdown component. Its paragraphs become separate
`Text` components, its bullets rows in a `Column`, its conferencing details their own labelled
block. Flattening the description into a single string discards every bit of the organiser's
structure and produces a wall of prose no reader scans. You are the renderer for those notes.

The guest list is structure too, not prose. Attendees are a `List` of rows, each with its own
response state — never a comma-joined sentence of names.

## Actions

- A committing action is never the default-styled button by accident. The confirming action of a
  proposal is the primary; everything else is secondary.
- An action that changes what is on screen must leave the user able to tell what changed. Do not
  repaint a whole agenda to reflect one event's answer.
- Give every action a label that names the outcome — "Create event", not "OK"; "Accept", not
  "Yes".
- **A label must not promise reach the agent does not have.** Creating an event notifies nobody,
  so no control may say "Invite", "Send invite" or "Ask them". "Create event" is what happens.
