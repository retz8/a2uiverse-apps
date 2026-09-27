# Material 3 brand guidance

Rules for composing A2UI surfaces that read as genuine Gmail product UI, not merely schema-valid
trees. Per-component semantics already live in the catalog's own component descriptions; this doc
carries only the **cross-component, brand-level** rules the catalog cannot state — and only rules
that change what you emit. A rule the model would already follow earns no place here.

Register: imperative. Read each line as an instruction. Explanations appear only where the bare
rule would be ambiguous.

Scope: this catalog is Gmail's own vocabulary in Material 3 — surfaces, stacks, lists of rows,
avatars, tags, chips, buttons, navigation rows and fields. The shapes, colours and type are the
components' own: a `Button` is a pill, a `ListItem` lifts on hover, a `Tag` is a small tinted
label. You choose which component plays which part of the screen; you never draw a shape.

This doc holds no domain instructions (what a given screen should _say_) — only how to build it in
Gmail's visual language.

---

## A screen is a white sheet on a tinted ground

- **Root every surface in a `Surface` with `container: "low"`** — the tinted ground Gmail's lists
  sit on — with `padding: "small"`. Its child is a `Stack`: a header, then the sheet.
- **The header is a `Stack` with `padding: "sm"`** holding the title — one `Text` in `titleLarge` —
  and, when it says something, a `bodySmall` line in `onSurfaceVariant` under it.
- **The sheet is a `Surface` with `container: "lowest"` and `padding: "none"`**: the white panel
  that holds a thread list, a thread's messages, or the controls that act on them.
- **A proposal to confirm is a compose window** instead: a `Surface` with `container: "lowest"`,
  `elevation: "level2"` and `padding: "none"`, whose first child is a title bar — a `Surface` with
  `container: "high"`, `shape: "none"` and `padding: "medium"` holding a `titleSmall` `Text` — then
  the fields, then the actions.
- **Do not put a sheet inside a sheet.** Inside the sheet, separate sections with a `Divider` or a
  list's own dividers, never with another surface.
- **Label a sheet's sections** with a `Stack` with `padding: "sm"` holding a `titleSmall` `Text` in
  `onSurfaceVariant`, so the label lines up with the rows under it. A `Text` placed straight in the
  sheet sits against its edge.

## Repeated like things are a `List` of `ListItem` rows

- **Threads in a mailbox are a `List` with `dividers: true` and `layout: "inline"`.** Each row is a
  `ListItem`: `leading` the sender's `Avatar` (`size: "medium"`), `headline` the sender, `meta` the
  time, `supporting` a `Stack` of the subject over the snippet. In a wide slot the row runs on one
  line as Gmail's inbox does; in a narrow one it stacks.
- **The messages of a thread are a `List` with `dividers: true` and `layout: "stacked"`**: `leading`
  the sender's `Avatar`, `headline` the sender in `titleSmall`, `meta` the time, `supporting` the
  message body.
- **A mailbox's labels or folders are `NavigationItem` rows**, the `label` glyph before each name,
  a count after it when the data carries one — never a `List` of plain text.
- A handful of unlike blocks is a `Stack`, not a `List`.

## A tappable row carries its own action

A `ListItem` or `NavigationItem` with an `action` is the whole row's press target and lifts on
hover. Never put a `Button` inside a row to open it: that gives every row two hit targets where a
mail client has one. `Stack`, `Surface` and `List` carry no action.

Inside a template, data-bind the action's event context by RELATIVE path —
`{"context": {"threadId": {"path": "id"}}}` — so every row carries its own target.

## Never fake a shape a component provides

Do not compose structure to imitate a shape: no `Stack` wrapping a `Text` to fake a chip or a tag,
no nested surfaces to fake a rounded edge. If a shape looks wrong, it is a catalog bug, not
something to work around in the tree.

## Layout and density

- Give every surface a single root container with `id: "root"`. Never emit a bare leaf (a lone
  `Text`, `Button`) as the root.
- One screen, one subject. A digest lists threads; it does not also open one.
- Prefer a short list that is fully readable to a long one that needs scrolling. Ten threads is a
  digest; forty is a data dump.
- Set spacing with a `Stack`'s own `gap` and `padding`, never with empty spacer components.

## Typography

- Use exactly one `titleLarge` `Text` for the surface's title: the digest's heading, or a thread's
  subject. Additional headings label genuine subsections, in `titleSmall`.
- A thread row's **sender is the primary label** — `weight: "bold"`, first. The subject follows at
  `weight: "medium"`, the snippet after it in `onSurfaceVariant`, each clamped to one line with
  `maxLines: 1`. That order is the whole reason a mail list is scannable; reversing it makes every
  row look alike.
- Timestamps are secondary: the row's `meta`, in `labelMedium` or `bodySmall`, `onSurfaceVariant`.
- A time keeps its date, year and zone, as the mailbox dates it — `2026-09-12 09:41 UTC`, the payload's
  UTC clock with `UTC` after it — never "Yesterday",
  a bare weekday or a month and day alone: those stop naming a day once the day has passed.
- A label a thread carries is a `Tag` beside the subject, never a sentence.
- Do not bold whole paragraphs of body text.

## Decompose a message body into components — never emit it as one `Text`

A mail body arrives as prose, often with structure: paragraphs, lists, quoted passages, links. There
is no markdown component. Its paragraphs become separate `Text` components in a `Stack`, its
bullets rows of their own, its links `Button`s with `variant: "text"` where they act and plain text
where they merely cite. Flattening a body into a single string discards every bit of the sender's
structure and produces a wall of prose no reader scans. You are the renderer for that body.

## Fields

- The header fields of a draft — To, Subject — are `TextField`s with `variant: "plain"`: the label
  before the value on one underlined line, as in Gmail's compose window.
- The body of a draft is a `TextField` with `variant: "plain"` and `multiline: true`.

## Actions

- A saving action is the one `filled` `Button`; everything else on the surface is `outlined` or
  `text`. The actions on a thread — draft a reply, archive — are `outlined` pills with their glyph
  (`reply`, `archive`), in a horizontal `Stack` with `padding: "md"` under the messages.
- An action that changes what is on screen must leave the user able to tell what changed. Do not
  repaint a whole digest to reflect one thread's label.
- Give every action a label that names the outcome — "Save draft", not "OK".
- A label filter or a label to add is a `Chip` with `variant: "filter"`, its `selected` bound to the
  data, never a row of `Button`s.
