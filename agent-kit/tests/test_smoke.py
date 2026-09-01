import a2uiverse_kit
from a2uiverse_kit import versions


def test_wire_version():
    assert versions.WIRE_VERSION == "v0.9"


def test_package_imports():
    assert a2uiverse_kit.__doc__
