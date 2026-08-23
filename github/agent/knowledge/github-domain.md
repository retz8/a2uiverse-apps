# GitHub domain knowledge

What the objects in this domain are, how they relate, and what a person is deciding when they ask
about one. This doc holds **facts and the decisions that hinge on them** — never what a screen
should contain. Composition is yours: you read the request, work out what the person is trying to
decide, and build the surface that serves it. Two requests about the same pull request can deserve
different surfaces, and a surface is not judged by how closely it resembles github.com.

Register: declarative. `brand-guidance.md` is imperative and covers how to build in Primer; this
covers what you are building _about_. A fact the model would already apply earns no place here —
what follows is what is easy to get wrong, or what a decision genuinely turns on.

---

## Pull requests

- A pull request proposes merging its **head** branch **into** its **base** branch. The direction is
  asymmetric and reversing it claims the change flows the wrong way: `author wants to merge N
commits into <base> from <head>`.
- Its commits are the head branch's commits. Its diff is base…head, with per-file additions and
  deletions. A total line count says how big the change is; the per-file breakdown says what it
  touched, which is a different question.
- **Neither the files nor the commits are part of the pull request object.** Fetching the pull
  request returns its metadata and its aggregate line counts, and nothing about which paths changed;
  the file list is a separate read, and so is the commit list. Having fetched the pull request is
  not the same as knowing what is in it.
- A **draft** pull request is explicitly not ready for review. Treating it as awaiting review
  misreads its author's intent.

### Whether it can merge

Three independent conditions gate a merge, and any one of them can block alone:

1. **Required reviews satisfied** — enough approvals, and no unresolved changes-requested.
2. **Required checks passing** — see below. Only _required_ checks block; others are informational.
3. **No conflict with the base branch.**

A pull request can be fully approved and still unmergeable, or mergeable with no approval at all.
"Approved" and "ready to merge" are not synonyms, and answering one when asked the other is wrong.

**GitHub computes this verdict itself and the pull request carries it.** `mergeable` answers the
conflict question, and `mergeable_state` answers the combined one: `clean` (nothing is blocking),
`unstable` (mergeable, but a check is failing, cancelled or otherwise not green), `blocked` (a
required review or check is missing), `dirty` (conflicts with the base), `behind` (the base moved
on). This field is the repository's own answer to "can this merge", already accounting for required
checks and required reviews. Re-deriving it by tallying check runs by hand is both unnecessary and
where the answer goes wrong: 28 runs whose conclusions you counted yourself is a claim you are
making, while `unstable` is a fact GitHub is reporting. When the two disagree, the field is right.

### Reviews and comments

- A **review** is a submitted verdict: `APPROVED`, `CHANGES_REQUESTED`, or `COMMENTED`. Only the
  latest review from each reviewer counts toward the decision; earlier ones are history.
- A **requested reviewer** has been asked and has not submitted. Requested and reviewed are disjoint
  states, and a list of reviewers that does not distinguish them says nothing about what is pending.
- Three kinds of comment exist, fetched through different calls and meaning different things: an
  **issue comment** on the conversation, a **review body** attached to a verdict, and a **review
  comment** anchored to a file and line. A line-anchored comment separated from its file and line
  has lost the thing it was about.
- Bot accounts (`dependabot`, `gemini-code-assist`, CI reporters) post comments and reviews. On an
  active pull request they can outnumber the human conversation while carrying little of it.
- A pull request with review requested and no approving review yet is _waiting on review_. That is a
  fact about its state. A repository label whose name happens to say so is one project's local
  convention and typically covers a fraction of what is actually waiting.

## Checks

- Two overlapping systems report on a commit: legacy **commit statuses** and **check runs** from
  GitHub Apps. Both attach to the head commit, so a pull request's CI state is the aggregate over
  its head SHA. Reading only one of the two under-reports.
- Conclusions are `success`, `failure`, `cancelled`, `skipped`, `neutral`, `timed_out`, `action_required`
  — plus runs still `queued` or `in_progress`, which have concluded nothing yet. **`skipped` and
  `cancelled` are not failures**; a build matrix routinely emits many skipped entries, and counting
  them as problems invents a broken build.
- **Nor are they successes.** A run that was cancelled did not pass, a run that was skipped never
  ran, and a run still queued has decided nothing. 28 runs of which 16 succeeded, 3 were cancelled
  and 9 were skipped is not 28 successes — it is a mixed result, and GitHub calls that state
  `unstable` precisely because it is neither green nor red. Collapsing a mix in either direction
  states something the data does not.

## Issues

- Issues and pull requests share **one number sequence per repository**: every pull request is also
  an issue, but not the reverse. Issue-level endpoints therefore return pull requests too unless
  filtered, and a list that silently mixes them misrepresents what it is showing.
- **A number identifies nothing on its own.** Because the sequence is per repository, `#2116` is
  meaningful only paired with the repository it belongs to — every repository has its own `#2116`.
  A reference carrying a number without its repository cannot be resolved back to anything, and that
  applies as much to what a surface hands back when someone acts on it as to what it displays.
- **Labels are per-repository conventions** with their own colors and meanings. They do not transfer
  between repositories, and their names cannot be assumed to mean what the same word means elsewhere.
- An issue is **stalled** when activity stopped while something was still expected of someone — an
  unanswered question, an assignment nobody picked up, an unactioned needs-info request. Age alone
  is not stalling; a quiet issue that is waiting on nothing is simply quiet.
- `#123` in a body or comment cross-references another issue or pull request, and a pull request can
  close an issue through a closing keyword. These references are how work in this domain connects.

## Repositories and users

- A repository's **default branch** is the base most pull requests target. Its open-issue count, as
  GitHub reports it, includes open pull requests.
- **The description, the language breakdown and the README are separate reads.** Fetching the
  repository returns its metadata — name, default branch, counts, and a single `language` field —
  and neither the README's contents nor the proportions of the languages inside it. A repository
  may carry no description at all, and an absent description is a fact to render as absent, not a
  gap to fill with a plausible sentence. The `language` field names only the **largest** language;
  the proportional breakdown is its own endpoint returning bytes per language, so reporting the
  primary language as "100%" is wrong for every repository that has more than one.
- **A repository says what it is in its README, and what it is made of in its tree.** These answer
  two different questions and neither one stands in for the other. The README is the project's own
  account of itself — what it is, who it is for, what engaging with it involves — and where a
  repository carries no description it is the only thing in it that answers that at all. The tree is
  the shape of the work: which parts exist, how they are grouped, what kind of project this is
  structurally. Someone meeting a repository is asking both at once, so having read one is not a
  reason to skip the other. The README is markdown, so of everything a repository holds it is the
  part whose contents you can actually compose.
- **`watchers_count` does not count watchers.** It is a legacy alias that returns the *star* count,
  and it sits in the payload beside `stargazers_count` carrying the identical number. The real count
  of people watching a repository is `subscribers_count`, and it is typically smaller by orders of
  magnitude. Reporting `watchers_count` as watchers states a figure that is wrong by that margin, and
  wrong in a way that looks plausible because the two fields agree.
- Repository content is a **tree** — the nesting is the information. A flat listing of the same paths
  answers a different question than the structure does.
- A user has a `login` (stable identifier, what other objects reference) and a display `name`
  (optional, mutable). Ownership of a repository is not authorship of its commits.

## Notifications

- A notification is a **thread the viewer is subscribed to**, carrying a **reason** — `review_requested`,
  `mention`, `assign`, `author`, `subscribed`, `manual`. The reason is precisely why it wants the
  viewer's attention, and two threads with the same title and different reasons are different asks.
- Reach is bounded by the token: public repositories only, none of the viewer's private ones. A thin
  result is a true result.

## What the person is deciding

Requests in this domain are decisions in progress. Reading which one is being made is the whole task
of composing a useful surface — these are the common ones, not a closed set:

- **Across a set** — which of these do I open first, and why that one. What separates the items
  matters more than what they share.
- **About one item** — can I act on this now, and if not, what is blocking it and whose move is it.
- **About a person or repository** — what is this, and what would I be joining if I engaged with it.
- **About the viewer's own queue** — what is waiting on _me_, as distinct from what is merely recent.

Someone who asks about a pull request is somewhere in a decision, not requesting a copy of a web
page. They are watching the surface arrive as you compose it, so what you put on it is time you are
spending on their behalf: material that does not serve the decision costs them to reach a place they
could have loaded themselves. Detail that is worth having but not worth showing at once has a home —
the catalog can expand it on the client, and anything you could compose as its own view is a
navigation away.
