# CircleCI brand guidance

Rules for composing A2UI surfaces that read as genuine CircleCI product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component
descriptions; this doc carries only the **cross-component, brand-level** rules the catalog cannot
state — and only rules that change what you emit.

Register: imperative. Read each line as an instruction.

Scope: this catalog is the **basic catalog** — eighteen primitives, no product component library.
The work is not selection, it is **assignment** — which primitive plays which role in CircleCI's
pipelines UI — and the theme does the rest. You do not build shapes; you choose what is a row, a
status, an action.

This doc holds no domain instructions (what a screen should _say_) — only how to build it in
CircleCI's visual language.

---

## The role each primitive plays

- **`Card` is the surface container.** Each view is one `Card` on the page background. Do not nest
  a `Card` inside a `Card`; inside a card, separate sections with a `Divider` or with spacing.
- **`Column` is the default container inside a card**; `Row` is for a line of peers — a status
  beside a branch beside a time, a set of actions. Reach for `Column` first.
- **`Divider` separates; it does not decorate.** Between a view's header and its body, never
  between every row of a list.

## A pipeline row reads status first

CircleCI's pipelines list is scanned down its status column. Build every run row in this order:

1. **Status** — its `StatusBadge`, first in the row.
2. **Branch** — the run's identity for the person; it is what they pushed.
3. **Commit** — the subject's first line, then the short hash in the caption register.
4. **When** and **who** — secondary, in the caption register.

A run's workflows sit **under** its row, each a quieter line of its own — its name in the
caption register beside its `StatusBadge`. A run is never flattened into its workflows, and a
workflow is never shown without the run it belongs to.

## Status is a `StatusBadge`, in CircleCI's own vocabulary

Every status on a surface — a run's, a workflow's, a job's — is a `StatusBadge`, never a `Text`.
Its `status` is the word CircleCI shows: **Success**, **Failed**, **Running**, **Canceled**,
**On Hold**, **Not Run**, **Queued**, **Error**. The badge draws CircleCI's pill in that status's
color; you choose the word, never a color, an icon or a sentence. In a list template, bind
`status` by relative path so every row carries its own.

## A tappable row is a borderless `Button` wrapping the row

Only interactive components carry an `action` — `Row`, `Column` and `Card` do not. A run row that
opens the run, or a job row that opens its failure, is a `Button` with `variant: "borderless"`
whose `child` is the row's content; the action sits on the button. Inside a template, data-bind
the action's event context by RELATIVE path — `{"context": {"runId": {"path": "id"}}}` — so every
row carries its own target.

## A job's output is its last lines, as printed

A log excerpt is a `Column` of lines bound as a template, each line a `Text` in the caption
register, in the order printed. Show the final lines around the error — a screenful, not the whole
log. Never merge lines into one `Text`, never reflow or reword them, never summarize them in
their place. Name the failed step and its exit code above the excerpt.

## Durations and times

- A duration is compact: `48s`, `2m 41s`, `1h 3m`.
- A time is secondary and never emphasized.

## Reruns and cancels

- A failed workflow offers **Rerun from failed** and **Rerun from start**; a running one offers
  **Cancel**. A workflow offers neither when its phase does not allow it — an ended workflow is
  never canceled, a running one never rerun.
- Each of these opens a proposal; none fires on its own.
- A proposal is a `Card` naming the project, the branch and the workflow as labelled rows, then
  what will run. Its confirming action is the one `primary` button, labelled with the outcome —
  **Rerun failed jobs**, **Rerun workflow**, **Cancel workflow**. The way out is a `borderless`
  button labelled **Keep as is**; never "Cancel", which is an action here.

## Never root a surface in `Modal`

`Modal` opens only from its own trigger child, so a surface rooted in one paints as a collapsed
trigger and the user sees nothing. A question is a `Card` like any other surface; the shell raises
it.

## Layout and density

- Give every surface a single root container with `id: "root"`. Never emit a bare leaf as the root.
- One screen, one subject. A pipelines list lists runs; it does not also open one.
- A handful of runs is a list; a page of them is a dump. Keep to the runs the request is about.
- Set spacing with the container's own gap, never with empty spacer components.

## Typography

- Use exactly one heading-weight `Text` for the surface's primary title.
- Branch names, workflow and job names, and hashes are shown exactly as the payload spells them.
- Do not bold whole rows; the status badge carries the row's weight.
