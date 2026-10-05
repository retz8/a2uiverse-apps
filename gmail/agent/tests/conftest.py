"""The work account answers the answer code called directly, unless a test signs in as
another: each fake account has its own mailbox and canned answers (task-12.11)."""

from __future__ import annotations

import pytest
from a2ui_agent_kit.testing import signed_in_as

from app.sign_in import SIGN_IN


@pytest.fixture(autouse=True)
def work_account():
    with signed_in_as(SIGN_IN, "you") as account:
        yield account
