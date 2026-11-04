import a2ui_agent_kit
from a2ui_agent_kit import versions


def test_the_kit_speaks_v09_and_v091_and_writes_fixtures_in_v09():
    assert versions.A2UI_VERSIONS == ("v0.9", "v0.9.1")
    assert versions.FIXTURE_VERSION == "v0.9"


def test_package_imports():
    assert a2ui_agent_kit.__doc__
