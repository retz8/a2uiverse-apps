# Linear brand guidance

Rules for composing A2UI surfaces that read as genuine Linear product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component
descriptions; this doc carries only the **cross-component, brand-level** rules the catalog cannot
state — and only rules that change what you emit.

Register: imperative. Read each line as an instruction.

Scope: this catalog is Linear's own vocabulary — a `Panel` holding a view, a `ViewHeader` across
its top, a `List` of one-line `ListItem` rows grouped by `ListGroup`, a `Property` per field, `Chip`s,
`Avatar`s, and the two glyphs every issue carries, `StatusIcon` and `PriorityIcon`. The work is
**assignment** — which component plays which role in Linear's issue views — and the catalog draws
the rest. You never choose a colour, a size or a glyph's shape.

This doc holds no domain instructions (what a screen should _say_) — only how to build it in
Linear's visual language.

---

## Every view is one `Panel`

- The surface's root is a `Panel` with `id: "root"`. Never nest a `Panel` in a `Panel`.
- A view that opens with a `ViewHeader` or holds a `List` sets the panel's `padding` to `"none"`,
  so the header and the rows run to its border. Its child is a `Stack` with `gap: "none"`: the
  `ViewHeader` first, then the list, or then a `Stack` with `padding: "l"` holding the rest.
- Inside, `Stack` is the container: a column by default, `direction: "horizontal"` for a line of
  peers. Set spacing with `gap`, never with empty components.
- `Divider` separates two sections of an issue. Never put one between rows: a `List` draws its own
  hairlines.

## The header names the view

- A list's `ViewHeader` has the team as its `context` and the list's name as its `title`: **My
  issues**, **Assigned**.
- An issue's `ViewHeader` has the team as its `context` and the issue's identifier as its `title`.
- The header is the view's only title line; do not repeat it as a `Text` beneath.

## An issue row is a `ListItem`

Linear's issue list is one dense line per issue. Build every row as a `ListItem`:

- `leading`, in this order: the issue's `PriorityIcon`, its identifier as a `secondary` `Text`,
  its `StatusIcon`.
- `child`: the issue's title, a `Text` with `weight: "medium"` — it takes the rest of the line.
- `trailing`: labels as `Chip`s, a linked branch or pull request, then when — each a `caption`
  `Text`.
- The row that opens the issue carries the `action` itself; never put a `Button` inside a row.
  Inside a template, bind the action's event context by RELATIVE path —
  `{"context": {"issueId": {"path": "id"}}}` — so every row carries its own target.

A row never spells out its status or priority in words; the glyphs carry them and are labelled for
assistive technology.

## A long list is grouped by state

When a list spans several workflow states, group it the way Linear does: a `List` whose children
are `ListGroup`s, one per state, each labelled with the state's name, led by its `StatusIcon` and
counted, open states in the order started, unstarted, backlog. Each group's `children` is its own
template over its own array. A list of one state, or of a handful of issues, is a single `List` of
rows with no groups.

## Status is a `StatusIcon`, priority is a `PriorityIcon`

Every issue status on a surface is a `StatusIcon`, never a `Text` alone: bind its `status` to the
issue's `status` and its `type` to its `statusType`. Every priority is a `PriorityIcon`: bind its
`priority` to the priority's name. In a list template, bind both by relative path so every row
carries its own.

Where a status or priority is a property being read — an issue's properties, a proposal — the glyph
sits beside a `Text` of the same name.

## An issue's detail: header, title, properties, description, links, activity

- The `ViewHeader`, then the issue's title as the one `title` `Text`.
- The properties follow, each a `Property` — **Status**, **Priority**, **Assignee**, **Labels** —
  whose children are the value's parts: the glyph and its name; an `Avatar` and the person's name;
  a `Chip` per label.
- The description follows as a `Markdown`, as written. Never summarize it in its place, and never
  put Markdown in a `Text`, which shows its syntax raw.
- Linked pull requests and the branch follow in a `Section` titled **Links**, counted: a pull
  request as a horizontal `Stack` of the `pull-request` `Icon`, its title and its number in the
  `caption` register; the branch as the `branch` `Icon` and its name, exactly as the payload spells
  it, in the `caption` register.
- Comments come last in a `Section` titled **Activity**, oldest first. Each comment is a `Stack`:
  a horizontal line of the author's `Avatar`, the author as a `Text` with `weight: "medium"` and
  when as a `caption`, then the body as a `Markdown`.

## Writes are proposed, then confirmed

- Each write opens a proposal; none fires on its own.
- A proposal is a `Panel` whose `ViewHeader` names the issue — team as `context`, identifier as
  `title` — then the question as the `title` `Text` and the issue's title beneath it as a `Text`
  with `weight: "medium"`, then what changes as `Property` rows from the current value to the new
  one: **Status** · Todo → In Progress, with the `arrow-right` `Icon` between the two. A new issue names its team and title; a comment shows its
  body as a `Markdown`, as it will be posted.
- The actions end the proposal in a horizontal `Stack`: the confirming action is the one `primary`
  `Button`, labelled with the outcome — **Move to In Progress**, **Set priority to High**, **Assign
  to me**, **Create issue**, **Post comment**. The way out is a `ghost` `Button` labelled **Keep as
  is**.

## Layout and density

- Give every surface a single root with `id: "root"`. Never emit a bare leaf as the root.
- One screen, one subject. A list of issues lists them; it does not also open one.
- Keep a list to the issues the request is about.

## Typography

- Use exactly one `title` `Text` per surface, for the issue's or the question's title. A list's
  name is its `ViewHeader`'s title.
- Identifiers, state names, labels and branch names are shown exactly as the payload spells them.
- A time is secondary and never emphasized, in the `caption` register. It keeps its date, year, clock
  and zone — `Sep 18, 2026, 11:00 AM UTC`, the payload's UTC clock with `UTC` after it.
- Do not set whole rows in `semibold`; the title carries the row at `medium`.
