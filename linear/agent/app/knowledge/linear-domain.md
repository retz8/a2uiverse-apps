# Linear domain knowledge

What the objects in this domain are, how they relate, and what a person is deciding when they ask
about one. This doc holds **facts and the decisions that hinge on them** — never what a screen
should contain. Composition is yours: you read the request, work out what the person is trying to
decide, and build the surface that serves it.

Register: declarative. `brand-guidance.md` is imperative and covers how to build in Linear's visual
language; this covers what you are building _about_. A fact the model would already apply earns
no place here — what follows is what is easy to get wrong, or what a decision genuinely turns on.

---

## Teams and identifiers

- A **team** owns its issues, its workflow states and its labels. A workspace holds one or more
  teams; `list_teams` returns them.
- An issue is named by its **identifier**: the team's key, a dash, and a number — `ENG-123`. The
  tools return it as `id` and accept it wherever they take an issue. The `uuid` beside it is the
  same issue's internal id; a person never reads it.
- An issue's `url` is its page in Linear's web app.

## Status

- An issue is in exactly one **workflow state**. Its `status` is the state's name as the team
  named it; its `statusType` is what kind of state that is: `triage`, `backlog`, `unstarted`,
  `started`, `completed`, `canceled`, or `duplicate`.
- Names are the team's own and vary between teams — one team's "In Progress" is another's
  "Doing". **The type is what a decision turns on**; the name is what the person reads. A team's
  states are `list_issue_statuses`.
- Open work is backlog, unstarted and started. Completed, canceled and duplicate are closed.
- `startedAt`, `completedAt` and `canceledAt` say when the issue entered those types; `stateHistory`
  in `get_issue` is every state it has been in, with when.

## Priority

- `priority` carries a `value` and a `name`: 1 **Urgent**, 2 **High**, 3 **Medium**, 4 **Low**, and
  0 **No priority**. The number runs backwards to the importance — a lower number is more
  urgent — **except 0, which is the least**: an issue with no priority orders after Low.
- Priority is set by a person. An issue nobody prioritized has no priority; it is not low.

## Assignee and labels

- An issue has at most one **assignee**. "My issues" are the issues assigned to the user. An
  issue with no assignee is unassigned, not the user's.
- **Labels** are the team's or the workspace's vocabulary — `list_issue_labels` — each with its
  own color. An issue carries any number of them.

## Description and comments

- An issue's `description` is Markdown, written by a person. `list_issues` cuts it short;
  `get_issue` returns it whole.
- **Comments** are `list_comments`: top-level threads and their replies, each with its author
  and when it was written. A comment whose `quotedText` is set was left on a passage of the
  description, which it quotes.

## Branches and pull requests

- Every issue carries a `gitBranchName`: the branch name Linear suggests for working on it —
  the user's handle, the identifier in lower case, and the title as a slug. It exists whether
  or not anyone has used it.
- Linear links a pull request to an issue when the pull request's branch contains the issue's
  identifier, or its title or description names the identifier after a magic word such as
  `Fixes`. A linked pull request is one of the issue's `attachments`, returned by `get_issue`
  and not by `list_issues`: its `title` is the pull request's title and its `url` is the pull
  request's page — `…/pull/481` — which holds its number. An attachment carries no state; the
  pull request's own page is where that lives.
- Other attachments sit beside pull requests. A workspace that syncs issues with GitHub adds the
  issue's mirrored GitHub issue — its `url` is `…/issues/…` and its title starts with its
  number. Tell them apart by the `url`.
- When a pull request was linked by its branch, that branch is the issue's `gitBranchName`.
  When it was linked by a magic word, its branch can be anything.
- With the team's default automations, opening a linked pull request moves its issue to a
  started state, and merging it moves the issue to a completed one. A status can therefore
  change without anyone touching the issue.

## Writes

- `save_issue` creates an issue when it is given no `id` — a `team` and a `title` are then
  required — and updates the issue it names otherwise, changing only the fields it is given.
- A status is set through `state`, by the state's name or type; a label through `addLabels` and
  `removeLabels`, which leave the others alone; an assignee through `assignee`, which takes
  `"me"`.
- `save_comment` adds a comment to an issue: its `issueId` and a Markdown `body`. A comment is
  published to everyone who follows the issue the moment it is saved.
- An issue is never deleted here. An issue that is not going to be done is moved to a canceled
  state, which keeps it and its history.

## What a request is deciding

- **"What's on my plate"** is deciding what to work on next: the user's open issues, the
  started ones first, then by priority. Closed issues are not on anyone's plate.
- **"What's urgent"** is deciding what cannot wait: Urgent and High first. No priority is not
  urgent.
- **"Open this issue"** is deciding what the work is and where it stands: its description, its
  state, whoever is on it, what the discussion says, and whether code for it exists yet — a
  linked pull request.
- **"Move it / assign it / file it"** is deciding to change the team's shared picture. The
  person needs to see exactly which issue changes, from what to what, before it does.
