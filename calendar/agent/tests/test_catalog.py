import pytest
from deterministic_agent.catalog import (
    catalog_json_path,
    get_catalog,
    supported_catalog_ids,
    validate_payload,
)


def test_catalog_path_points_at_sibling_package():
    path = catalog_json_path()
    assert path.is_file()
    assert path.parts[-3:] == ("catalogs", "v0.9.1", "catalog.json")


def test_catalog_id_is_the_primer_catalog_url():
    cid = get_catalog().catalog_id
    assert cid.startswith("https://github.com/")
    assert cid.endswith("calendar-catalog/catalogs/v0.9.1/catalog.json")
    assert supported_catalog_ids() == [cid]


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
    validate_payload(payload)  # must not raise


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
        validate_payload(payload)
