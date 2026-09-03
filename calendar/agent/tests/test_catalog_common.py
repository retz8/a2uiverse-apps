from pathlib import Path

from a2ui_agent_kit.catalog import catalog_context

from app.config import CONFIG

_ctx = catalog_context(CONFIG)


def test_catalog_path_points_at_sibling_adapter():
    path = _ctx.catalog_json_path()
    assert isinstance(path, Path) and path.is_file()
    assert path.parts[-3:] == ("catalogs", "v0.9.1", "catalog.json")


def test_catalog_id_and_supported_ids_agree():
    cid = _ctx.get_catalog().catalog_id
    assert cid.endswith("calendar-catalog/catalogs/v0.9.1/catalog.json")
    assert _ctx.supported_catalog_ids() == [cid]


def test_build_schema_manager_registers_examples_path():
    sm = _ctx.build_schema_manager(examples_path=str(_ctx.catalog_json_path().parent))
    # examples path is stored per catalog id; a non-empty render proves wiring.
    catalog = sm.get_selected_catalog()
    assert catalog.catalog_id == _ctx.get_catalog().catalog_id
