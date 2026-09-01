# Google Calendar domain knowledge

What the objects in this domain are, how they relate, and what a person is deciding when they ask
about one. This doc holds **facts and the decisions that hinge on them** — never what a screen
should contain. Composition is yours: you read the request, work out what the person is trying to
decide, and build the surface that serves it. Two requests about the same day can deserve
different surfaces, and a surface is not judged by how closely it resembles calendar.google.com.

Register: declarative. `brand-guidance.md` is imperative and covers how to build in Material 3;
this covers what you are building _about_. A fact the model would already apply earns no place
here — what follows is what is easy to get wrong, or what a decision genuinely turns on.

---

## Events

- The unit is the **event**. An event has a start and an end, and those two fields are the whole
  of when it happens — there is no separate duration to report and none to compute.
- An event the user did not create still sits on their calendar. Being on the calendar says
  nothing about whether they agreed to it; `responseStatus` says that.
- An event's `summary` is its title, and it is frequently the only thing that identifies it. A
  person says "the review" meaning whatever event has "review" in its title.

## Timed and all-day events are different objects

- A **timed** event carries a date-and-time start and end. An **all-day** event carries a date
  only, and its end date is **exclusive** — a one-day event ends on the following date.
- Reporting an all-day event as starting at midnight is wrong: it has no time, and midnight is a
  time. Reporting a timed event as "all day" because it is long is equally wrong.
- All-day events are usually context rather than commitments — someone's leave, a holiday, a
  travel day. They rarely belong in the same list as the meetings they surround, and never count
  as a scheduling conflict on their own.

## Recurrence: the instance is not the series

- A recurring event is one **series** plus many **instances**. A list over a range returns
  instances; each carries its own start, its own end, and its own id.
- An instance can differ from its series — moved, shortened, or cancelled on its own — so the
  series' fields are not authority for any particular day.
- "Cancel the standup" is ambiguous between this instance and every future one, and you hold no
  tool for either. Do not resolve the ambiguity; say you cannot change it.

## Time zones

- Every timed event carries its own time zone, and the calendar has a default that need not match
  it. An event created in another zone displays in the viewer's, and the underlying instant is
  the same either way.
- You do not convert between zones. Report what the payload gives you. A time you recomputed is a
  time a person may act on, and being an hour wrong about a meeting is worse than being silent
  about a zone.

## Attendees, the organiser, and responseStatus

- The **organiser** owns the event. **Attendees** are invited to it, each with their own
  `responseStatus`: `needsAction`, `accepted`, `declined`, `tentative`.
- The user appears in the attendee list as one entry among others, usually flagged as `self`.
  **The user's own `responseStatus` is the one that answers "have I replied?"** — another
  attendee's status says nothing about the user.
- `needsAction` is the state that means an invitation is waiting. It is the single most
  load-bearing piece of state on an event the user did not create.
- A **declined** event usually still appears in a listing. An event the user declined is not on
  their plate and does not conflict with anything.
- An event with no attendees is something the user put on their own calendar — a block, a
  reminder, a piece of focus time. It has no invitation and no response.

## What "needs attention" means

Nobody means "everything on the calendar". A full day of accepted, recurring meetings needs
nothing from anybody — it is already settled. What needs attention is where the calendar is
**waiting on this person or is inconsistent**:

- an invitation whose `responseStatus` is `needsAction` — somebody asked and has had no answer;
- two events that overlap, where at least one is not declined — the person is committed twice and
  only they can resolve it;
- what is **imminent** — the next event, and what remains today, because that is the part of the
  calendar a person can still act on.

An event that is accepted, not overlapping, and days away needs nothing. Listing it under
"attention" buries the two or three that do.

## Free and busy

- Busy intervals come from the free/busy query, not from counting events. An event the user
  declined does not make them busy, and an all-day event usually does not either.
- A gap between two events is not necessarily free time — it is only a gap in what the queried
  range returned.
- Do not assert that two events conflict unless you have both their starts and ends. "Back to
  back" and "overlapping" are different facts and a person schedules differently around each.

## Creating an event

- A created event is **real immediately**. There is no draft event and no staging state: the
  moment the tool succeeds, it is on the calendar. That is why creation is proposed and confirmed
  rather than performed on first ask.
- **Attendees are never notified.** Every call is forced to be non-notifying, so an event created
  with guests on it does not mail them and does not appear to them as an invitation awaiting a
  reply. It simply appears on their calendar. The user must be told this on the surface, because
  the ordinary expectation is the opposite one, and a person who believes invitations went out
  will not send them.
- An event you created cannot be deleted, cancelled or edited by you afterwards. Proposing one is
  therefore a one-way step, and the confirmation is the last point at which anything can be
  changed.

## Answering an invitation

- Answering sets the user's own `responseStatus` on an event somebody else owns. It changes
  nothing else — not the event, not the other guests, not the time.
- `tentative` is a real answer, not a deferral. "Maybe" is expressible.
- Answering is reversible: a response can be changed later, which is why it needs no confirmation
  step where creating an event does.
