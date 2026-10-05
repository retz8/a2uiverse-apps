"""Wipes and repopulates the demo calendar from the tracked seed corpus.

Task-2.7 decision 5. Two properties are load-bearing, and both exist because a calendar is
dates rather than documents:

**Relative dating.** `seed_events.json` gives every event a `dayOffset` from the run date, not
a date. An absolutely-dated seed is an empty agenda a few months later, and the live demo then
shows nothing — which is exactly the moment (2.9's composed fan-out recording) when nobody has
time to discover it.

**Wipe and recreate.** Two of the four beats write to this calendar: `event-create` adds an
event and `rsvp-toggle` flips a response. Run the beats twice without a wipe and the calendar
has drifted from the corpus it was recorded against, so each recording degrades its own
source. Re-seeding restores a known state in one command.

This talks to the Calendar REST API directly rather than through MCP: it is developer setup,
not agent behaviour, and it deliberately uses the delete verb the agent itself is forbidden.

**The test account's own primary calendar** (task-12.10 decisions 8 and 11). The agent reads
each signed-in account's primary calendar, so the demo calendar is the primary calendar of a
dedicated test Google account, signed in to the agent in live mode with access to add events.
This script uses that account's Google token from the agent's sign-in store, named by its
email, and wipes that account's calendar — never name your own.

Run it before recording beats and before any live demo:

    uv run python -m scripts.seed_calendar --account <test account email>
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import httpx
from a2ui_agent_kit.sign_in import VendorSignInEnded
from a2ui_agent_kit.sign_in_store import SignInStore
from dotenv import load_dotenv

_AGENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_AGENT_DIR))

from app.sign_in import GOOGLE_SCOPES, UPSTREAM, WRITE  # noqa: E402

API_ROOT = "https://www.googleapis.com/calendar/v3"
SEED_PATH = Path(__file__).resolve().parent / "seed_events.json"
CALENDAR_ID = "primary"


class SeedAccountError(RuntimeError):
    """The named test account cannot seed: not signed in, or without access to add events."""


def _token(state_dir: Path, email: str) -> str:
    """The test account's Google token from the agent's sign-in store, refreshed if due."""
    store = SignInStore(state_dir)
    data = json.loads(store.path.read_text(encoding="utf-8"))
    found = [
        (sub, a)
        for sub, a in data["accounts"].items()
        if a["kind"] == "vendor" and (a["claims"].get("email") or "").lower() == email.lower()
    ]
    if not found or found[0][1].get("vendor_token") is None:
        raise SeedAccountError(
            f"{email} is not signed in to the Calendar agent in live mode. Sign in through "
            "A2UIVerse first — see agent/README.md, 'Demo calendar'."
        )
    sub, account = found[0]
    token = account["vendor_token"]
    granted = set((token.get("scope") or "").split())
    if not set(GOOGLE_SCOPES[WRITE]) <= granted:
        raise SeedAccountError(
            f"{email} has not let the agent add events. Ask the agent to add one event and "
            "allow it, then seed again."
        )
    try:
        renewed = asyncio.run(UPSTREAM.fresh(token))
    except VendorSignInEnded as exc:
        raise SeedAccountError(f"{email}'s sign-in has ended; sign in again.") from exc
    if renewed is not None:
        store.set_vendor_token(sub, renewed)
        token = renewed
    return token["access_token"]


def _client(token: str) -> httpx.Client:
    return httpx.Client(
        base_url=API_ROOT,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=30.0,
    )


def _wipe(client: httpx.Client, calendar_id: str) -> int:
    """Deletes every event on the demo calendar. Returns how many went."""
    removed = 0
    while True:
        response = client.get(f"/calendars/{calendar_id}/events", params={"maxResults": 250})
        response.raise_for_status()
        items = response.json().get("items", [])
        if not items:
            return removed
        for item in items:
            # sendUpdates=none on the way out too: wiping a seeded event must not mail the
            # stand-in attendees, exactly as the agent's own writes must not.
            deleted = client.delete(
                f"/calendars/{calendar_id}/events/{item['id']}",
                params={"sendUpdates": "none"},
            )
            if deleted.status_code not in (200, 204, 404, 410):
                deleted.raise_for_status()
            removed += 1


def _times(event: dict, today: date, time_zone: str) -> dict:
    """Resolves an event's relative dating into the API's start/end shape."""
    day = today + timedelta(days=int(event.get("dayOffset", 0)))
    if event.get("allDay"):
        # An all-day event's end date is EXCLUSIVE — a one-day event ends the next date.
        return {
            "start": {"date": day.isoformat()},
            "end": {"date": (day + timedelta(days=1)).isoformat()},
        }
    start = datetime.combine(day, datetime.strptime(event["start"], "%H:%M").time())
    end = datetime.combine(day, datetime.strptime(event["end"], "%H:%M").time())
    return {
        "start": {"dateTime": start.isoformat(), "timeZone": time_zone},
        "end": {"dateTime": end.isoformat(), "timeZone": time_zone},
    }


def _body(event: dict, today: date, time_zone: str, self_email: str | None) -> dict:
    attendees = [dict(a) for a in event.get("attendees", [])]
    # The viewer's own row, added only to events that HAVE guests. An event with no
    # attendees is a block the person put on their own calendar: it has no invitation and no
    # response, and that is a distinct row shape the agenda has to be able to show. Giving it
    # a lone self-attendee would turn every personal block into a meeting with one guest.
    #
    # `self_email` is the test account's address, its primary calendar's id. That is what
    # makes the beats work: Google sets `self: true` on the attendee matching the calendar
    # being queried, so the agent reads this row as "my own response" exactly as it would on
    # a real user's calendar — and no personal address enters the corpus.
    # Verified on the first live run: needsAction does stick this way, which is what
    # `rsvp-toggle` needs (task-2.7 spec, open item 2 — resolved).
    if self_email and event.get("selfResponse") and attendees:
        attendees.append(
            {"email": self_email, "self": True, "responseStatus": event["selfResponse"]}
        )
    body = {
        "summary": event["summary"],
        **_times(event, today, time_zone),
    }
    for field in ("location", "description"):
        if event.get(field):
            body[field] = event[field]
    if attendees:
        body["attendees"] = attendees
    return body


def _time_zone(client: httpx.Client, calendar_id: str) -> str:
    """The calendar's time zone, which an event list carries — readable with the events
    scopes alone."""
    response = client.get(f"/calendars/{calendar_id}/events", params={"maxResults": 1})
    response.raise_for_status()
    return response.json().get("timeZone", "UTC")


def seed(email: str, state_dir: Path, dry_run: bool = False) -> int:
    load_dotenv(_AGENT_DIR / ".env")
    calendar_id = CALENDAR_ID
    corpus = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    events = corpus["events"]
    today = date.today()

    if dry_run:
        for event in events:
            print(f"  {event['key']:<16} day{int(event.get('dayOffset', 0)):+d}  {event['summary']}")
        print(f"\n{len(events)} events would be written to {email}'s calendar (nothing sent).")
        return 0

    with _client(_token(state_dir, email)) as client:
        time_zone, self_email = _time_zone(client, calendar_id), email
        removed = _wipe(client, calendar_id)
        print(f"wiped {removed} event(s) from {email}'s calendar")
        for event in events:
            body = _body(event, today, time_zone, self_email)
            response = client.post(
                f"/calendars/{calendar_id}/events",
                params={"sendUpdates": "none"},
                json=body,
            )
            response.raise_for_status()
            print(f"  + {event['key']}")
    print(f"\nseeded {len(events)} event(s) into {email}'s calendar ({time_zone}), dated from {today}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--account",
        required=True,
        help="The test Google account's email. Its primary calendar is wiped and seeded.",
    )
    parser.add_argument(
        "--state-dir",
        type=Path,
        default=_AGENT_DIR / ".state",
        help="The Calendar agent's sign-in store, if it runs with --state-dir.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Resolve and print the corpus without touching the calendar.",
    )
    args = parser.parse_args()
    try:
        return seed(args.account, args.state_dir, dry_run=args.dry_run)
    except SeedAccountError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
