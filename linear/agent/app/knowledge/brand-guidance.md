# Linear brand guidance

Rules for composing A2UI surfaces that read as genuine Linear product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component
descriptions; this doc carries only the **cross-component, brand-level** rules the catalog cannot
state — and only rules that change what you emit.

Register: imperative. Read each line as an instruction.

Scope: this catalog is the **basic catalog** — eighteen primitives — plus two product components,
`StatusIcon` and `PriorityIcon`. The work is not selection, it is **assignment** — which
primitive plays which role in Linear's issue views — and the theme does the rest. You do not build
shapes; you choose what is a row, a status, an action.

This doc holds no domain instructions (what a screen should _say_) — only how to build it in
Linear's visual language.

---

## The role each primitive plays

- **`Card` is the surface container.** Each view is one `Card` on the page background. Do not nest
  a `Card` inside a `Card`; inside a card, separate sections with a `Divider` or with spacing.
- **`Column` is the default container inside a card**; `Row` is for a line of peers — the icons,
  identifier and title of an issue, a set of actions. Reach for `Column` first.
- **`Divider` separates; it does not decorate.** Between a view's header and its body, or between
  sections of an issue — never between every row of a list.

## An issue row reads priority, identifier, status, title

Linear's issue list is one dense line per issue. Build every issue row in this order:

1. **Priority** — its `PriorityIcon`.
2. **Identifier** — `ENG-123`, in the caption register.
3. **Status** — its `StatusIcon`.
4. **Title** — the issue's title, the row's one body-weight text, taking the remaining width.
5. **Labels**, then **when** — secondary, in the caption register, at the row's end.

A row never spells out its status or priority in words; the icons carry them and are labelled for
assistive technology.

## A long list is grouped by state

When a list spans several workflow states, group it the way Linear does: one section per state,
headed by the state's `StatusIcon` and its name with the section's count, open states in the order
started, unstarted, backlog. Each section is its own list template over its own array. A list of
one state, or of a handful of issues, is a single list.

## Status is a `StatusIcon`, priority is a `PriorityIcon`

Every issue status on a surface is a `StatusIcon`, never a `Text`: bind its `status` to the
issue's `status` and its `type` to its `statusType`. Every priority is a `PriorityIcon`: bind its
`priority` to the priority's name. In a list template, bind both by relative path so every row
carries its own. You choose which issue's values go where, never a color or a glyph.

Where a status or priority is a property being read — an issue's properties, a proposal — put the
icon in a `Row` beside a `Text` of the same name.

## A tappable row is a borderless `Button` wrapping the row

Only interactive components carry an `action` — `Row`, `Column` and `Card` do not. An issue row
that opens the issue is a `Button` with `variant: "borderless"` whose `child` is the row's content;
the action sits on the button. Inside a template, data-bind the action's event context by RELATIVE
path — `{"context": {"issueId": {"path": "id"}}}` — so every row carries its own target.

## An issue's detail: title, properties, description, links, activity

- The identifier sits above the title in the caption register; the title is the surface's one
  heading.
- The properties follow as labelled rows — **Status**, **Priority**, **Assignee**, **Labels** —
  each label in the caption register and its value beside it.
- The description follows as written, in the body register. Never summarize it in its place.
- A description and a comment body are Markdown. Bind each as written to a body-register `Text`,
  which renders it; never to a caption or a heading, which show its syntax raw.
- Linked pull requests and the branch follow the description, each a row of its own: a pull
  request by its title with its number in the caption register; the branch by its name, exactly
  as the payload spells it, in the caption register.
- Comments come last, oldest first: the author and when in the caption register, the body as
  written beneath.

## Writes are proposed, then confirmed

- Each write opens a proposal; none fires on its own.
- A proposal is a `Card` naming the issue — its identifier and title — then what changes as
  labelled rows, from the current value to the new one: **Status** Todo → In Progress. A new issue
  names its team and title; a comment shows its body as it will be posted.
- Its confirming action is the one `primary` button, labelled with the outcome — **Move to In
  Progress**, **Set priority to High**, **Assign to me**, **Create issue**, **Post comment**. The
  way out is a `borderless` button labelled **Keep as is**.

## Never root a surface in `Modal`

`Modal` opens only from its own trigger child, so a surface rooted in one paints as a collapsed
trigger and the user sees nothing. A question is a `Card` like any other surface; the shell raises
it.

## Layout and density

- Give every surface a single root container with `id: "root"`. Never emit a bare leaf as the root.
- One screen, one subject. A list of issues lists them; it does not also open one.
- Keep a list to the issues the request is about.
- Set spacing with the container's own gap, never with empty spacer components.

## Typography

- Use exactly one heading-weight `Text` for the surface's primary title.
- Identifiers, state names, labels and branch names are shown exactly as the payload spells them.
- A time is secondary and never emphasized: `Sep 18`, `2h ago`.
- Do not bold whole rows; the title carries the row.
