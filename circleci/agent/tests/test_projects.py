"""The configured projects (task-7.2 decision 8): parsed from the environment, fail fast."""

from __future__ import annotations

import pytest

from app.projects import (
    PROJECTS_ENV,
    ProjectsNotConfiguredError,
    configured_projects,
    list_projects,
    parse_projects,
)


def test_pairs_parse_to_name_and_id():
    assert parse_projects("a2uiverse=5475943e, other = abc ") == [
        {"name": "a2uiverse", "id": "5475943e"},
        {"name": "other", "id": "abc"},
    ]


def test_a_malformed_entry_is_an_error_not_skipped():
    with pytest.raises(ProjectsNotConfiguredError):
        parse_projects("a2uiverse")


def test_no_projects_fails_fast_naming_the_alternative(monkeypatch):
    monkeypatch.delenv(PROJECTS_ENV, raising=False)
    with pytest.raises(ProjectsNotConfiguredError) as excinfo:
        configured_projects()
    assert PROJECTS_ENV in str(excinfo.value)
    assert "--mode stub" in str(excinfo.value)


def test_the_tool_hands_the_model_the_configured_list(monkeypatch):
    monkeypatch.setenv(PROJECTS_ENV, "a2uiverse=5475943e")
    assert list_projects() == {"projects": [{"name": "a2uiverse", "id": "5475943e"}]}
