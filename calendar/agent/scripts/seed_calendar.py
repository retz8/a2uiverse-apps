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

Run it before recording beats and before any live demo:

    uv run python -m scripts.seed_calendar
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import google.auth
import google.auth.exceptions
import google.auth.transport.requests
import httpx
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from llm_agent.mcp import (  # noqa: E402
    CALENDAR_SCOPES,
    MissingGoogleCredentialError,
    demo_calendar_id,
    quota_project,
)

API_ROOT = "https://www.googleapis.com/calendar/v3"
SEED_PATH = Path(__file__).resolve().parent / "seed_events.json"


def _token() -> str:
    try:
        credentials, _ = google.auth.default(scopes=list(CALENDAR_SCOPES))
    except google.auth.exceptions.DefaultCredentialsError as exc:
        raise MissingGoogleCredentialError(
            "No Application Default Credentials. See agent/README.md, "
            "'Setting up the Calendar credential'."
        ) from exc
    credentials.refresh(google.auth.transport.requests.Request())
    return credentials.token


def _client(token: str, project: str) -> httpx.Client:
    return httpx.Client(
        base_url=API_ROOT,
        headers={
            "Authorization": f"Bearer {token}",
            "X-Goog-User-Project": project,
            "Content-Type": "application/json",
        },
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
    # The viewer's own row. `rsvp-toggle` needs an event carrying the user as an attendee
    # with something to answer; whether the API honours a self-attendee response on an event
    # the same account organises is the open question this seed exists to expose on the first
    # live run (task-2.7 spec, open item 2).
    if self_email and event.get("selfResponse"):
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


def _calendar_meta(client: httpx.Client, calendar_id: str) -> tuple[str, str | None]:
    response = client.get(f"/calendars/{calendar_id}")
    response.raise_for_status()
    payload = response.json()
    return payload.get("timeZone", "UTC"), payload.get("id")


def seed(dry_run: bool = False) -> int:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    calendar_id = demo_calendar_id()
    project = quota_project()
    corpus = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    events = corpus["events"]
    today = date.today()

    if dry_run:
        for event in events:
            print(f"  {event['key']:<16} day{int(event.get('dayOffset', 0)):+d}  {event['summary']}")
        print(f"\n{len(events)} events would be written to {calendar_id} (nothing sent).")
        return 0

    with _client(_token(), project) as client:
        time_zone, self_email = _calendar_meta(client, calendar_id)
        removed = _wipe(client, calendar_id)
        print(f"wiped {removed} event(s) from {calendar_id}")
        for event in events:
            body = _body(event, today, time_zone, self_email)
            response = client.post(
                f"/calendars/{calendar_id}/events",
                params={"sendUpdates": "none"},
                json=body,
            )
            response.raise_for_status()
            print(f"  + {event['key']}")
    print(f"\nseeded {len(events)} event(s) into {calendar_id} ({time_zone}), dated from {today}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Resolve and print the corpus without touching the calendar.",
    )
    args = parser.parse_args()
    try:
        return seed(dry_run=args.dry_run)
    except MissingGoogleCredentialError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
