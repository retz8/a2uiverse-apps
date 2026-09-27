# CircleCI brand guidance

Rules for composing A2UI surfaces that read as genuine CircleCI product UI, not merely
schema-valid trees. Per-component semantics already live in the catalog's own component
descriptions; this doc carries only the **cross-component, brand-level** rules the catalog cannot
state — and only rules that change what you emit.

Register: imperative. Read each line as an instruction.

Scope: this catalog is CircleCI's own vocabulary — fourteen components: `Stack`, `Panel`,
`Heading`, `Text`, `Link`, `Button`, `StatusBadge`, `StatusIcon`, `List`, `ListItem`, `Field`,
`Divider`, `LogBlock`, `LogLine`. There is no `Card`, `Column`, `Row` or `Modal`. This doc holds
no domain instructions (what a screen should _say_) — only how to build it in CircleCI's visual
language.

---

## Composition and layout

- Give every surface a single root with `id: "root"` — a `Panel` holding a `Stack`, or a `Stack` of
  `Panel`s when the view has several sections. Never emit a bare leaf as the root.
- `Stack` is the only layout container. `direction: "vertical"` for a view, `"horizontal"` for a
  line of peers — a status beside a name beside a duration. Push the last peer to the edge with
  `justify: "spaceBetween"`; set spacing with `gap`, never with empty spacer components.
- A `Panel` is one section on the page: a run's summary, a pipeline with its jobs, a failed step
  with its log. Do not nest a `Panel` inside a `Panel`; inside one, separate sections with a
  `Divider` or with `gap`.
- One screen, one subject. A pipelines list lists runs; it does not also open one.
- A handful of runs is a list; a page of them is a dump. Keep to the runs the request is about.

## A view leads with its subject and its status

- Open a view with a horizontal `Stack`: a `Heading` naming the subject — the branch of a run,
  the name of a workflow or job — then its `StatusBadge`, `align: "center"`.
- Under it, a run's facts are a summary row: a horizontal `Stack` of `Field`s separated by vertical
  `Divider`s — **Duration**, **Branch**, **Commit**, **Author**. A commit hash is `font: "mono"`.

## Status

- Every status on a surface is a `StatusBadge` or a `StatusIcon`, never a `Text`. Its `status` is
  the word CircleCI shows — **Success**, **Failed**, **Running**, **On Hold**, **Queued**,
  **Canceled**, **Not Run**, **Error**, **Blocked** — or the status value as the tool spells it.
  You choose the word, never a color or a glyph.
- The subject of a view and each run in a list carry a `StatusBadge`. The rows of a list — the
  jobs of a workflow, the steps of a job — lead with a `StatusIcon`.
- In a list template, bind `status` by relative path so every row carries its own.

## Lists and rows

- A collection is a `List` of `ListItem`s bound as a template, each row's content a horizontal
  `Stack`. A pipeline's jobs under it use `connector: "tree"`.
- A row that opens its object carries the action on its `ListItem` — the whole row is the target.
  Bind the event context by relative path — `{"context": {"jobId": {"path": "id"}}}` — so every row
  carries its own target. Never put a `Link` or a `Button` inside a row that already acts.
- A run row reads, left to right: its `StatusBadge`, the branch, the commit subject
  (`truncate: true`) with the short hash beside it in `font: "mono"`, then the time and author,
  `tone: "muted"`. A job row reads: its `StatusIcon`, the job name, its duration at the end,
  `tone: "muted"`.
- A run's workflows sit under its row, quieter — a `List` with `connector: "tree"`, each row its
  `StatusIcon` and its name. A run is never flattened into its workflows, and a workflow is never
  shown without its run.

## A failed job

- The failed step is a `Panel` with `tone: "danger"`: a horizontal `Stack` of its `StatusIcon`,
  the step name (`weight: "medium"`) and its exit code, `tone: "muted"`, at the end; then its
  output.
- Output is a `LogBlock` of `LogLine`s bound as a template, one line each, in the order printed.
  Show the final lines around the error — a screenful, not the whole log. Never merge lines into
  one `LogLine`, never reflow or reword them, never summarize them in their place.

## Actions

- A failed workflow offers **Rerun from failed** and **Rerun from start**; a running one offers
  **Cancel workflow**. A workflow offers neither when its phase does not allow it — an ended
  workflow is never canceled, a running one never rerun.
- Each of these opens a proposal; none fires on its own. Put them in a horizontal `Stack` at the
  end of the view they act on, as `secondary` buttons.
- A proposal is a `Panel`: a `Heading` asking the question, the project, branch and workflow as
  `Field`s, one `Text` saying what will run, then the answers. The confirming action is the one
  `primary` `Button`, labelled with the outcome — **Rerun failed jobs**, **Rerun workflow**,
  **Cancel workflow**. The way out is a `ghost` button labelled **Keep as is**; never "Cancel",
  which is an action here.
- A branch, commit or job named inside a fact rather than a row may be a `Link` when pressing it
  opens that object; otherwise it is `Text`.

## Typography

- Use exactly one `Heading` with `size: "large"` per surface — its subject. Section titles inside
  it are `"medium"` or `"small"`.
- Branch names, workflow and job names, and hashes are shown exactly as the payload spells them.
- A time or a duration is secondary: `tone: "muted"`, never emphasized. A duration is compact:
  `48s`, `2m 41s`, `1h 3m`.
- Do not bold whole rows; the status carries the row's weight.
