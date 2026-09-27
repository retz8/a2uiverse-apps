# Material 3 brand guidance

Rules for composing A2UI surfaces that read as genuine Google Calendar product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component descriptions; this doc
carries only the **cross-component, brand-level** rules the catalog cannot state — and only rules
that change what you emit. A rule the model would already follow earns no place here.

Register: imperative. Read each line as an instruction. Explanations appear only where the bare
rule would be ambiguous.

Scope: this catalog is Google Calendar's own vocabulary in Material 3 — surfaces, stacks, lists of
rows, event colours, avatars with their responses, chips, buttons and fields. The shapes, colours
and type are the components' own: a `Button` is a pill, a `ColorSwatch` is an event's colour, an
`Avatar` carries a guest's answer. You choose which component plays which part of the screen; you
never draw a shape.

This doc holds no domain instructions (what a given screen should _say_) — only how to build it in
Calendar's visual language.

---

## Three kinds of screen

- **An agenda is a white sheet on a tinted ground**: a root `Surface` with `container: "low"` and
  `padding: "small"`, holding a `Stack` of a header — a `Stack` with `padding: "sm"` and one
  `titleLarge` `Text` — and the sheet, a `Surface` with `container: "lowest"` and
  `padding: "none"`.
- **One event is its details card**: a root `Surface` with `container: "high"`,
  `shape: "extraLarge"` and `padding: "medium"`. It opens with the title row — a horizontal `Stack`
  with `gap: "lg"` and `align: "start"` of the event's `ColorSwatch` and a `Stack` of the title in
  `titleLarge` over the date line in `onSurfaceVariant` — then its details.
- **A proposal to confirm is the create dialog**: a root `Surface` with `container: "high"`,
  `shape: "extraLarge"`, `padding: "large"` and `elevation: "level2"`, holding the title as a
  `TextField` with `variant: "plain"` and `size: "large"`, the details, and the actions at the end
  of a horizontal `Stack` with `justify: "end"`.
- **Do not put a sheet inside a sheet.** Inside one, separate sections with a `Divider` or spacing,
  never with another surface.

## Repeated like things are a `List` of `ListItem` rows

- **Events in an agenda are a `List` with `layout: "inline"`**, one per section. Each row is a
  `ListItem`: `leading` a `ColorSwatch` with `shape: "dot"`, `headline` the time, `supporting` a
  `Stack` of the title over a `bodySmall` line in `onSurfaceVariant`. In a wide slot the row runs on
  one line as Calendar's schedule does; in a narrow one it stacks.
- **Label an agenda's sections** with a `Stack` with `padding: "sm"` holding a `titleSmall` `Text`
  in `primary`, and a `Divider` between sections.
- **An event's details are a `List` of `ListItem` rows, each led by its glyph**: `location_on` for
  the place, `notes` for the description, `group` for the guests, `schedule` for the time,
  `videocam` for a call, `notifications` for a reminder.
- **Guests are a `Stack` of rows**, each a horizontal `Stack` of an `Avatar` with `size: "medium"`
  and its `status` bound to the guest's response, beside the name over the response in `bodySmall`.
  A guest list is never a comma-joined sentence of names.
- A handful of unlike blocks is a `Stack`, not a `List`.

## A tappable row carries its own action

A `ListItem` with an `action` is the whole row's press target. Never put a `Button` inside a row to
open it: that gives every row two hit targets where an agenda has one. `Stack`, `Surface` and
`List` carry no action.

Inside a template, data-bind the action's event context by RELATIVE path —
`{"context": {"eventId": {"path": "id"}}}` — so every row carries its own target.

## Never fake a shape a component provides

Do not compose structure to imitate a shape: no `Stack` wrapping a `Text` to fake a chip, no
nested surfaces to fake a rounded edge, no coloured `Text` for an event's colour — that is a
`ColorSwatch`. If a shape looks wrong, it is a catalog bug, not something to work around in the
tree.

## Layout and density

- Give every surface a single root container with `id: "root"`. Never emit a bare leaf (a lone
  `Text`, `Button`) as the root.
- One screen, one subject. An agenda lists events; it does not also open one.
- Prefer a short list that is fully readable to a long one that needs scrolling. A day is an
  agenda; a month is a data dump.
- **Group an agenda by day, and label each group.** A flat list of times with no day boundaries is
  unreadable the moment it crosses midnight. One day needs no grouping.
- Set spacing with a `Stack`'s own `gap` and `padding`, never with empty spacer components.

## Typography

- Use exactly one `titleLarge` `Text` for the surface's title. Additional headings label genuine
  subsections, in `titleSmall`.
- An agenda row's **time is the primary label** — the row's `headline`, in `labelLarge`, so the
  times form a column the eye runs down. The title follows in `bodyMedium`, the place or the reason
  it needs attention after it in `bodySmall`. This is the inverse of a mail list, where the
  correspondent leads: a person scans a calendar by _when_, and a row that leads with its title
  makes the one thing they are looking for the thing they have to hunt for.
- An all-day event has no time to lead with. Give it the day's group label and no time — never a
  fabricated "12:00 AM".
- Do not bold whole paragraphs of an event's notes.

## Decompose an event's notes into components — never emit them as one `Text`

An event's description arrives as prose, often with structure: an agenda, a list of links, dial-in
details, a paragraph of context. There is no markdown component. Its paragraphs become separate
`Text` components in a `Stack`, its bullets rows of their own, its conferencing details their own
detail row. Flattening the description into a single string discards every bit of the organiser's
structure and produces a wall of prose no reader scans. You are the renderer for those notes.

## Actions

- A committing action is the one `filled` `Button`; everything else is `outlined` or `text`.
- **An invitation's answers are a "Going?" bar**: a `Surface` with `container: "highest"`,
  `shape: "none"` and `padding: "medium"` closing the card, holding a horizontal `Stack` with
  `justify: "spaceBetween"` of the `Text` "Going?" and a `Stack` of three `Button`s — Yes, No,
  Maybe, as Calendar words them. The answer already given is `tonal`; the others are `outlined`.
- An action that changes what is on screen must leave the user able to tell what changed. Do not
  repaint a whole agenda to reflect one event's answer.
- Give every other action a label that names the outcome — "Create event", not "OK".
- **A label must not promise reach the agent does not have.** Creating an event notifies nobody,
  so no control may say "Invite", "Send invite" or "Ask them". "Create event" is what happens.
- A choice some later control commits — a day or a range — is a set of `Chip`s with
  `variant: "filter"`, their `selected` bound to the data. A control that must act on the press is a
  `Button`.
