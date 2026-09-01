"""Headless beat driver: runs an app's beats against its live agent and keeps the streams.

Task 8.1. The agent records what it streams (recorder.py, armed by A2UI_RECORD_DIR);
this driver supplies the prompts, threads the conversation, and finalizes each session
into a per-beat fixture under the app's `recordings/beats/`. The beats themselves —
prompts, titles, chaining — are the app's, carried by its `scripts/record_beats.py`
shim along with its agent URL and directories.

It talks A2A JSON-RPC over SSE directly rather than through a client SDK: the only
things it needs off the wire are the conversation id and the end of the stream, and the
recorder — not this driver — is what captures the content.

The agent must already be running. The model is an agent-startup concern (ADK builds the
LlmAgent once), so a beat that needs a different rung of the model ladder is driven in a
separate invocation against a separately-started agent.
"""

from __future__ import annotations

import argparse
import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx

# Beat 2 has taken up to 6.5 minutes on a slower rung (7.7 journal, R4); the ceiling is
# generous so a slow turn is never mistaken for a hung one.
TURN_TIMEOUT_S = 900.0
MAX_ATTEMPTS_PER_BEAT = 3


class Turn:
    """One prompt to send. `chains` keeps the previous turn's conversation."""

    def __init__(self, beat: int, slug: str, title: str, prompt: str, chains: bool = False):
        self.beat = beat
        self.slug = slug
        self.title = title
        self.prompt = prompt
        self.chains = chains


def log(message: str) -> None:
    print(f"[record-beats] {message}", flush=True)


def send_turn(client: httpx.Client, text: str, context_id: str | None) -> tuple[str | None, int]:
    """POSTs one prompt and drains the SSE stream. Returns (contextId, event count)."""
    message: dict = {
        "kind": "message",
        "role": "user",
        "messageId": uuid.uuid4().hex,
        "parts": [{"kind": "text", "text": text}],
    }
    if context_id:
        message["contextId"] = context_id
    body = {
        "jsonrpc": "2.0",
        "id": uuid.uuid4().hex,
        "method": "message/stream",
        "params": {"message": message},
    }

    seen_context = context_id
    events = 0
    with client.stream("POST", "/", json=body, timeout=TURN_TIMEOUT_S) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if not line.startswith("data:"):
                continue
            events += 1
            try:
                payload = json.loads(line[len("data:") :].strip())
            except json.JSONDecodeError:
                continue
            result = payload.get("result")
            if isinstance(result, dict) and result.get("contextId"):
                seen_context = result["contextId"]
    return seen_context, events


def read_session(record_dir: Path, context_id: str) -> dict | None:
    safe = "".join(c if c.isalnum() or c in "._-" else "-" for c in context_id)
    path = record_dir / f"session-{safe}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def turn_is_good(turn: dict) -> tuple[bool, str]:
    """A usable fixture completed and actually painted a surface."""
    if turn.get("outcome") != "completed":
        return False, f"outcome={turn.get('outcome')}"
    created = [
        msg
        for batch in turn.get("batches", [])
        for msg in batch.get("messages", [])
        if "createSurface" in msg
    ]
    if not created:
        return False, "no createSurface reached the client"
    return True, "ok"


def write_fixture(
    fixture_dir: Path, spec: Turn, session: dict, turn: dict, model: str, chained_from: str | None
) -> Path:
    fixture_dir.mkdir(parents=True, exist_ok=True)
    name = f"beat-{spec.beat}-{spec.slug}"
    fixture = {
        "name": name,
        "beat": spec.beat,
        "title": spec.title,
        "prompt": spec.prompt,
        "model": model,
        "recordedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "contextId": session.get("contextId"),
        "chainedFrom": chained_from,
        "turns": [turn],
    }
    path = fixture_dir / f"{name}.json"
    path.write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")
    return path


def drive(
    specs: list[Turn], model: str, record_dir: Path, url: str, fixture_dir: Path
) -> int:
    results: list[tuple[Turn, bool, str]] = []
    client = httpx.Client(base_url=url)
    index = 0
    while index < len(specs):
        spec = specs[index]
        # A chained beat is driven together with the one it follows, in one conversation.
        group = [spec]
        while index + 1 < len(specs) and specs[index + 1].chains:
            index += 1
            group.append(specs[index])
        index += 1

        for attempt in range(1, MAX_ATTEMPTS_PER_BEAT + 1):
            label = "+".join(str(t.beat) for t in group)
            log(f"beat {label}: attempt {attempt}/{MAX_ATTEMPTS_PER_BEAT}")
            context_id: str | None = None
            failure: str | None = None
            started = time.monotonic()
            try:
                for spec_in_group in group:
                    log(f"  -> beat {spec_in_group.beat}: {spec_in_group.prompt!r}")
                    context_id, events = send_turn(client, spec_in_group.prompt, context_id)
                    log(f"     stream closed after {events} events ({time.monotonic()-started:.0f}s)")
            except Exception as err:  # wire/timeout failure: retry the whole group
                failure = f"{type(err).__name__}: {err}"
                log(f"  !! {failure}")

            session = read_session(record_dir, context_id) if context_id else None
            if failure is None and session is not None:
                recorded = session["turns"][-len(group) :]
                verdicts = [turn_is_good(t) for t in recorded]
                if all(ok for ok, _ in verdicts):
                    chained_from = None
                    for spec_in_group, turn in zip(group, recorded):
                        path = write_fixture(
                            fixture_dir, spec_in_group, session, turn, model, chained_from
                        )
                        chained_from = f"beat-{spec_in_group.beat}-{spec_in_group.slug}"
                        log(f"  ok  {path}")
                        results.append((spec_in_group, True, "ok"))
                    break
                failure = "; ".join(
                    f"beat {t.beat}: {why}" for t, (ok, why) in zip(group, verdicts) if not ok
                )
                log(f"  !! {failure}")

            if attempt == MAX_ATTEMPTS_PER_BEAT:
                # Record best-available and flag, rather than stalling the run.
                if session is not None:
                    chained_from = None
                    for spec_in_group, turn in zip(group, session["turns"][-len(group) :]):
                        path = write_fixture(
                            fixture_dir, spec_in_group, session, turn, model, chained_from
                        )
                        chained_from = f"beat-{spec_in_group.beat}-{spec_in_group.slug}"
                        log(f"  FLAGGED (best available) {path}")
                        results.append((spec_in_group, False, failure or "unknown"))
                else:
                    for spec_in_group in group:
                        results.append((spec_in_group, False, failure or "nothing recorded"))

    log("")
    log("=== summary ===")
    failures = 0
    for spec, ok, why in sorted(results, key=lambda r: r[0].beat):
        log(f"beat {spec.beat} {spec.slug}: {'ok' if ok else 'FLAGGED — ' + why}")
        failures += 0 if ok else 1
    return 1 if failures else 0


def main(
    beats: list[Turn],
    agent_url: str,
    *,
    record_dir: Path,
    fixture_dir: Path,
    argv: list[str] | None = None,
) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--beats",
        default=",".join(str(b.beat) for b in beats),
        help="comma-separated beat numbers",
    )
    parser.add_argument("--model", required=True, help="model the agent was started with (recorded)")
    parser.add_argument("--record-dir", default=str(record_dir))
    parser.add_argument("--url", default=agent_url, help="agent base URL")
    args = parser.parse_args(argv)

    wanted = {int(n) for n in args.beats.split(",") if n.strip()}
    # A chained beat cannot be driven without the beat it follows.
    for spec in beats:
        if spec.chains and spec.beat in wanted:
            wanted.add(spec.beat - 1)
    specs = [b for b in beats if b.beat in wanted]

    log(f"agent {args.url} · model {args.model} · beats {[s.beat for s in specs]}")
    return drive(specs, args.model, Path(args.record_dir), args.url, fixture_dir)
