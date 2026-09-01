import pytest

from a2uiverse_kit.catalog import catalog_context

from app.config import CONFIG

_ctx = catalog_context(CONFIG)


def test_catalog_path_points_at_sibling_package():
    path = _ctx.catalog_json_path()
    assert path.is_file()
    assert path.parts[-3:] == ("catalogs", "v0.9.1", "catalog.json")


def test_catalog_id_is_the_hosted_catalog_url():
    cid = _ctx.get_catalog().catalog_id
    assert cid.startswith("https://github.com/")
    assert cid.endswith("github-catalog/catalogs/v0.9.1/catalog.json")
    assert _ctx.supported_catalog_ids() == [cid]


def test_validate_accepts_a_known_good_text_update():
    payload = [
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "s1",
                "components": [{"id": "label", "component": "Text", "text": "ok"}],
            },
        }
    ]
    _ctx.validate_payload(payload)  # must not raise


def test_validate_rejects_an_undeclared_property():
    payload = [
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "s1",
                "components": [
                    {"id": "label", "component": "Text", "text": "x", "bogus": 1}
                ],
            },
        }
    ]
    with pytest.raises(ValueError):
        _ctx.validate_payload(payload)
