"""Tool-response shaping (task 7.7).

Payload shapes here are taken from real responses of the read-only GitHub MCP server,
not invented: `search_repositories` genuinely omits `description` for a repository that
has none, and `get_check_runs` for a2ui#2123 genuinely returned 23 runs — 15 success,
8 skipped, zero failures — while the surface claimed "All checks have passed".

The walker's mechanics are the kit's since task 3.3 (decision 4 normalized this agent's
one-arg in-place variant onto it); every assertion below runs the real payloads through
the normalized walker and pins that the shaped output is unchanged.
"""

from __future__ import annotations

import json

from app.tool_shaping import PROJECTION_NOTE, annotate, shape_tool_response


def mcp_response(payload: dict) -> dict:
    return {"content": [{"type": "text", "text": json.dumps(payload)}], "isError": False}


def decoded(response: dict) -> dict:
    return json.loads(response["content"][0]["text"])


# The real projection: no `description` key at all.
REPO_SEARCH = {
    "total_count": 1,
    "incomplete_results": False,
    "items": [
        {
            "id": 1063641074,
            "name": "a2ui",
            "full_name": "a2ui-project/a2ui",
            "language": "TypeScript",
            "stargazers_count": 15951,
            "forks_count": 1247,
            "open_issues_count": 290,
            "default_branch": "main",
        }
    ],
}

CHECK_RUNS = {
    "total_count": 23,
    "check_runs": (
        [{"name": f"ok-{i}", "status": "completed", "conclusion": "success"} for i in range(15)]
        + [{"name": f"skip-{i}", "status": "completed", "conclusion": "skipped"} for i in range(8)]
    ),
}


class TestProjectionNote:
    def test_names_the_fields_the_payload_actually_carries(self):
        out = decoded(shape_tool_response(mcp_response(REPO_SEARCH)))
        notes = out["_payload_notes"]
        assert notes["fields_present"] == ["incomplete_results", "items", "total_count"]

    def test_states_that_an_absent_field_was_not_fetched(self):
        # The whole point: `description` is missing from the projection, and the model
        # must not read that silence as licence to write one.
        out = decoded(shape_tool_response(mcp_response(REPO_SEARCH)))
        assert out["_payload_notes"]["reading"] == PROJECTION_NOTE
        assert "not fetched" in PROJECTION_NOTE.lower()
        assert "description" not in json.dumps(REPO_SEARCH["items"][0])

    def test_leaves_the_original_data_untouched(self):
        out = decoded(shape_tool_response(mcp_response(REPO_SEARCH)))
        assert out["items"] == REPO_SEARCH["items"]
        assert out["total_count"] == 1


class TestCheckRunTally:
    def test_counts_by_conclusion(self):
        out = decoded(shape_tool_response(mcp_response(CHECK_RUNS)))
        tally = out["_payload_notes"]["check_run_tally"]
        assert tally["total"] == 23
        assert tally["by_conclusion"] == {"skipped": 8, "success": 15}

    def test_skipped_runs_are_not_counted_as_failing(self):
        out = decoded(shape_tool_response(mcp_response(CHECK_RUNS)))
        assert out["_payload_notes"]["check_run_tally"]["failing"] == 0

    def test_failing_counts_only_genuine_failures(self):
        payload = {
            "check_runs": [
                {"status": "completed", "conclusion": "failure"},
                {"status": "completed", "conclusion": "timed_out"},
                {"status": "completed", "conclusion": "action_required"},
                {"status": "completed", "conclusion": "cancelled"},
                {"status": "completed", "conclusion": "neutral"},
                {"status": "in_progress", "conclusion": None},
            ]
        }
        tally = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"][
            "check_run_tally"
        ]
        assert tally["failing"] == 3
        assert tally["not_yet_concluded"] == 1
        assert tally["total"] == 6

    def test_no_tally_when_the_payload_has_no_check_runs(self):
        out = decoded(shape_tool_response(mcp_response(REPO_SEARCH)))
        assert "check_run_tally" not in out["_payload_notes"]


class TestAnnotateDeclines:
    # The walker's own pass-throughs are the kit's tests; these pin the vendor hook.
    def test_a_json_list_payload_is_left_alone(self):
        # annotate() only knows how to describe an object's fields.
        assert shape_tool_response(mcp_response([1, 2, 3])) is None  # type: ignore[arg-type]

    def test_annotate_declines_non_dict_payloads(self):
        assert annotate([1, 2, 3]) is None
        assert annotate("text") is None


class TestEmptyFieldsAreNamed:
    def test_names_a_null_field_on_a_single_search_item(self):
        # The real payload: `minimal_output: false` returns description explicitly null,
        # and the model wrote one anyway when the note was only generic.
        payload = {"total_count": 1, "items": [dict(REPO_SEARCH["items"][0], description=None)]}
        notes = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"]
        assert "description" in notes["fields_returned_empty"]
        assert "not a gap to fill" in notes["empty_fields_reading"]

    def test_treats_empty_string_and_empty_list_as_empty(self):
        payload = {"description": "", "topics": [], "name": "a2ui"}
        notes = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"]
        assert notes["fields_returned_empty"] == ["description", "topics"]

    def test_no_empty_note_when_every_field_carries_a_value(self):
        notes = decoded(shape_tool_response(mcp_response(CHECK_RUNS)))["_payload_notes"]
        assert "fields_returned_empty" not in notes

    def test_names_the_fields_each_item_actually_carries(self):
        # the real search_users projection: four fields, no name/bio/company/location
        payload = {
            "total_count": 1,
            "incomplete_results": False,
            "items": [{"login": "gspencergoog", "id": 1, "avatar_url": "a", "profile_url": "p"}],
        }
        notes = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"]
        assert notes["item_fields_present"] == ["avatar_url", "id", "login", "profile_url"]
        assert "ONLY the fields listed" in notes["item_fields_reading"]
        # the envelope keys must not be mistaken for the item's keys
        assert notes["fields_present"] == ["incomplete_results", "items", "total_count"]

    def test_item_fields_reported_for_a_multi_item_search_too(self):
        payload = {"items": [{"name": "a", "path": "a"}, {"name": "b", "path": "b"}]}
        notes = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"]
        assert notes["item_fields_present"] == ["name", "path"]

    def test_no_item_note_when_there_is_no_items_list(self):
        notes = decoded(shape_tool_response(mcp_response(CHECK_RUNS)))["_payload_notes"]
        assert "item_fields_present" not in notes

    def test_does_not_flatten_a_multi_item_search(self):
        payload = {"items": [{"description": None}, {"description": "real"}]}
        notes = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"]
        assert "description" not in notes.get("fields_returned_empty", [])


class TestDirectoryListing:
    def test_flags_a_listing_as_names_only(self):
        payload = {
            "entries": [
                {"name": "README.md", "type": "file", "path": "README.md"},
                {"name": "docs", "type": "dir", "path": "docs"},
            ]
        }
        notes = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"]
        note = notes["directory_listing_reading"]
        assert "not even a README" in note
        # covers one level, and every entry is fetchable by its path
        assert "ONE level" in note
        assert "fetched by passing" in note

    def test_the_listing_note_states_no_catalog_facts(self):
        # renderability is the prompt's ROLE, not this layer's — one rule, one wording
        payload = {"entries": [{"name": "a.ts", "type": "file", "path": "a.ts"}]}
        notes = decoded(shape_tool_response(mcp_response(payload)))["_payload_notes"]
        note = notes["directory_listing_reading"]
        assert "render" not in note and "compose" not in note

    def test_a_non_listing_payload_gets_no_listing_note(self):
        notes = decoded(shape_tool_response(mcp_response(REPO_SEARCH)))["_payload_notes"]
        assert "directory_listing_reading" not in notes
