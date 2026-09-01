# Gmail domain knowledge

What the objects in this domain are, how they relate, and what a person is deciding when they ask
about one. This doc holds **facts and the decisions that hinge on them** — never what a screen
should contain. Composition is yours: you read the request, work out what the person is trying to
decide, and build the surface that serves it. Two requests about the same thread can deserve
different surfaces, and a surface is not judged by how closely it resembles mail.google.com.

Register: declarative. `brand-guidance.md` is imperative and covers how to build in Material 3; this
covers what you are building _about_. A fact the model would already apply earns no place here —
what follows is what is easy to get wrong, or what a decision genuinely turns on.

---

## Threads and messages

- The unit of the mailbox is the **thread**, not the message. A thread is a conversation; a search
  returns threads, and a person says "that email" meaning the thread.
- A thread's messages are ordered oldest first. **The last message is the one that needs answering** —
  it is the state of the conversation. Leading with the first message describes how the conversation
  started, which is rarely what was asked.
- `message_count` is authoritative. Do not infer thread length from however many messages you chose
  to render.

## A reply body is its top segment

A mail body carries the new text **and** the quoted chain beneath it, usually the entire prior
conversation, plus a signature. The quoted chain is not new content: it is the thread you already
have as separate messages. Rendering it repeats every earlier message inside the latest one and
turns a thread detail into a wall of duplicated text.

The new content is what precedes the first quote marker — a line of `>` prefixes, an "On ⟨date⟩
⟨sender⟩ wrote:" attribution, or a delimiter block. Everything after it belongs to messages you can
already show properly. Signatures and legal disclaimers below the sign-off are likewise not content.

## Labels

- Labels are not folders. A thread carries **many** labels at once, and removing one does not file it
  anywhere else.
- System labels are distinguishable from user labels by `type`. `INBOX`, `UNREAD`, `STARRED`,
  `IMPORTANT`, `SENT`, `DRAFT` are system state, not user categories — "unread" is a label, and so is
  "in the inbox".
- **Archiving is removing `INBOX`**, not adding anything. A person asking to archive is asking for
  `unlabel_thread` with `INBOX`.
- `UNREAD` is the label that decides whether a thread is bold in every mail client ever built. It is
  the single most load-bearing piece of state on a thread.
- The category tabs (`CATEGORY_PROMOTIONS`, `CATEGORY_SOCIAL`, `CATEGORY_UPDATES`, `CATEGORY_FORUMS`)
  are labels too. A thread in Promotions is not in the person's working inbox in any meaningful
  sense, whatever `INBOX` says.

## What "needs attention" means

Nobody means "everything unread". Unread includes every newsletter and receipt. The threads that need
attention are the ones where **someone is waiting on this person**: addressed to them directly rather
than a list, recent, not in a promotional category, and — the strongest signal — the last message is
from someone else. A thread whose last message the person sent themselves is waiting on the *other*
party, not on them.

## Drafts

- A draft is a real object in the mailbox with its own id, separate from the thread it replies to. It
  exists whether or not it is ever sent.
- **There is no send.** This agent can create a draft; it cannot send mail. Saying a reply was sent
  is false. A draft is saved, and the person sends it themselves.
- **There is no delete.** A draft this agent creates cannot be removed by it. Do not offer to discard
  one.
- A reply draft must carry the message it answers, or it starts a new conversation instead of
  continuing one.

## Search

- The query language is Gmail's own: `is:unread`, `from:`, `to:`, `newer_than:7d`, `has:attachment`,
  `category:primary`, `label:`. A well-chosen query is one call; fetching everything and filtering it
  yourself is many, and wrong more often.
- Search returns a projection — thread and message *metadata*, not bodies. Having searched is not
  having read. A body needs the thread fetched.
