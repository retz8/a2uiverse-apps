from llm_agent.tools import STUB_TOOLS, get_pull_request, list_pull_requests


def test_list_returns_open_prs_with_bindable_fields():
    prs = list_pull_requests()
    assert prs and all(pr["state"] == "open" for pr in prs)
    first = prs[0]
    for key in ("number", "title", "user", "labels", "html_url"):
        assert key in first
    assert "login" in first["user"]


def test_list_state_all_includes_closed_and_merged_shapes():
    # The fixture carries the real GitHub state encoding the model must learn to map:
    # merged is state "closed" WITH merged_at; closed-unmerged is "closed" without.
    prs = list_pull_requests(state="all")
    assert len(prs) > len(list_pull_requests())
    closed = [pr for pr in prs if pr["state"] == "closed"]
    assert any(pr.get("merged_at") for pr in closed)
    assert any(not pr.get("merged_at") for pr in closed)


def test_list_includes_a_dependabot_pr():
    # Demo beat 3 ("ignore the dependabot bumps") needs bot PRs in the open list.
    prs = list_pull_requests()
    assert any(pr["user"]["login"] == "dependabot[bot]" for pr in prs)


def test_list_includes_a_pr_without_labels():
    assert any(not pr["labels"] for pr in list_pull_requests(state="all"))


def test_get_returns_detail_for_a_known_pr():
    pr = get_pull_request(231)
    assert pr["number"] == 231
    for key in ("body", "head", "base", "additions", "deletions", "changed_files"):
        assert key in pr


def test_get_unknown_pr_returns_error():
    assert "error" in get_pull_request(999999)


def test_stub_tools_are_read_only_pair():
    assert STUB_TOOLS == [list_pull_requests, get_pull_request]
