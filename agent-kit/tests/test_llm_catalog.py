"""Catalog machinery tests, run against both catalog kinds.

Single vendor-neutral copy of the agents' test_llm_catalog / test_catalog /
test_catalog_common machinery assertions, parametrized over the two fixture
catalogs so the `custom` id-strip branch and the `basic` allOf-flatten branch
are both exercised.
"""

import json

import pytest

from a2ui_agent_kit.catalog import CatalogContext, catalog_context


@pytest.fixture
def ctx(any_config) -> CatalogContext:
    return CatalogContext(any_config)


def _good_surface(ctx: CatalogContext) -> list[dict]:
    return [
        {
            "version": "v0.9",
            "createSurface": {
                "surfaceId": "s1",
                "catalogId": ctx.supported_catalog_ids()[0],
            },
        },
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "s1",
                "components": [
                    {
                        "id": "root",
                        "component": "Column",
                        "align": "stretch",
                        "children": ["greeting"],
                    },
                    {"id": "greeting", "component": "Text", "text": "hello"},
                ],
            },
        },
    ]


def _templated_surface(ctx: CatalogContext) -> list[dict]:
    """A list-template surface with correct relative item bindings and data."""
    return [
        {
            "version": "v0.9",
            "createSurface": {
                "surfaceId": "s1",
                "catalogId": ctx.supported_catalog_ids()[0],
            },
        },
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "s1",
                "components": [
                    {
                        "id": "root",
                        "component": "Column",
                        "align": "stretch",
                        "children": ["items"],
                    },
                    {
                        "id": "items",
                        "component": "Column",
                        "children": {"componentId": "row", "path": "/pulls"},
                    },
                    {"id": "row", "component": "Column", "children": ["title"]},
                    {"id": "title", "component": "Text", "text": {"path": "title"}},
                ],
            },
        },
        {
            "version": "v0.9",
            "updateDataModel": {
                "surfaceId": "s1",
                "path": "/",
                "value": {"pulls": [{"title": "PR one"}, {"title": "PR two"}]},
            },
        },
    ]


# --- locate/load (from test_catalog_common / test_catalog) ---


def test_catalog_path_points_at_the_configured_file(ctx):
    path = ctx.catalog_json_path()
    assert path.is_file()
    assert path.name == "catalog.json" or path.suffix == ".json"


def test_catalog_id_and_supported_ids_agree(ctx):
    cid = ctx.get_catalog().catalog_id
    assert cid.endswith("/catalog.json")
    assert ctx.supported_catalog_ids() == [cid]


def test_build_schema_manager_registers_examples_path(ctx):
    sm = ctx.build_schema_manager(examples_path=str(ctx.catalog_json_path().parent))
    catalog = sm.get_selected_catalog()
    assert catalog.catalog_id == ctx.get_catalog().catalog_id


def test_examples_dir_exists_with_curated_examples(ctx):
    assert ctx._config.examples_dir.is_dir()
    assert sorted(p.name for p in ctx._config.examples_dir.glob("*.json"))


def test_live_schema_manager_loads_examples(ctx):
    sm = ctx.live_schema_manager()
    catalog = sm.get_selected_catalog()
    examples = sm.load_examples(catalog)
    assert "---BEGIN" in examples  # examples path resolved and rendered


def test_curated_examples_validate_as_complete_surfaces(ctx):
    for path in sorted(ctx._config.examples_dir.glob("*.json")):
        messages = json.loads(path.read_text(encoding="utf-8"))["messages"]
        ctx.validate_surface(messages)  # every example is a valid complete surface


def test_catalog_context_factory_is_cached_per_config(any_config):
    assert catalog_context(any_config) is catalog_context(any_config)


# --- validate_payload (deterministic mode's partial-update probe) ---


def test_validate_payload_accepts_a_known_good_text_update(ctx):
    payload = [
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "s1",
                "components": [{"id": "label", "component": "Text", "text": "ok"}],
            },
        }
    ]
    ctx.validate_payload(payload)  # must not raise


def test_validate_payload_rejects_an_undeclared_property(ctx):
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
        ctx.validate_payload(payload)


# --- validate_surface (llm mode's 4-pass check) ---


def test_validate_surface_accepts_a_complete_surface(ctx):
    ctx.validate_surface(_good_surface(ctx))  # must not raise


def test_validate_surface_rejects_an_undeclared_property(ctx):
    payload = _good_surface(ctx)
    payload[1]["updateComponents"]["components"][0]["bogus"] = 1
    with pytest.raises(ValueError):
        ctx.validate_surface(payload)


def test_validate_surface_rejects_a_missing_root(ctx):
    payload = _good_surface(ctx)
    payload[1]["updateComponents"]["components"][0]["id"] = "not-root"
    with pytest.raises(ValueError):
        ctx.validate_surface(payload)


def test_validate_surface_rejects_an_orphan_component(ctx):
    payload = _good_surface(ctx)
    payload[1]["updateComponents"]["components"].append(
        {"id": "orphan", "component": "Text", "text": "unreachable"}
    )
    with pytest.raises(ValueError):
        ctx.validate_surface(payload)


def test_validate_surface_accepts_a_template_with_relative_bindings(ctx):
    ctx.validate_surface(_templated_surface(ctx))  # must not raise


def test_validate_surface_rejects_a_binding_on_a_literal_prop(ctx):
    # Icon.name is enum-typed — the pre-pass rejects a binding there with a targeted
    # message (regression for the live run that streamed {"path": "/iconName"}).
    payload = _good_surface(ctx)
    payload[1]["updateComponents"]["components"][0]["children"] = ["greeting", "ic"]
    payload[1]["updateComponents"]["components"].append(
        {"id": "ic", "component": "Icon", "name": {"path": "/iconName"}}
    )
    with pytest.raises(ValueError, match="data-bound"):
        ctx.validate_surface(payload)


def test_binding_on_literal_prop_is_rejected_even_when_later_overwritten(ctx):
    # The client renders incrementally: a poisoned occurrence crashes it even if a
    # later message rewrites the same id with a literal, so every occurrence must fail.
    payload = _good_surface(ctx)
    payload[1]["updateComponents"]["components"][0]["children"] = ["greeting", "ic"]
    payload[1]["updateComponents"]["components"].append(
        {"id": "ic", "component": "Icon", "name": {"path": "/iconName"}}
    )
    payload.append(
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "s1",
                "components": [{"id": "ic", "component": "Icon", "name": "mail"}],
            },
        }
    )
    with pytest.raises(ValueError, match="data-bound"):
        ctx.validate_surface(payload)


def test_enum_binding_gets_a_targeted_message_with_allowed_values(ctx):
    # The correction the retry receives must say WHAT to do — never bind this prop,
    # pick a literal — and list the legal enum values.
    payload = _good_surface(ctx)
    payload[1]["updateComponents"]["components"][0]["children"] = ["greeting", "st"]
    payload[1]["updateComponents"]["components"].append(
        {
            "id": "st",
            "component": "Text",
            "text": "Open",
            "variant": {"path": "/pr/state"},
        }
    )
    with pytest.raises(ValueError, match="never be data-bound") as excinfo:
        ctx.validate_surface(payload)
    message = str(excinfo.value)
    assert "'variant'" in message and "Text" in message
    assert "caption" in message  # allowed enum values are listed
    assert "literal" in message


def test_enum_binding_in_a_template_gets_the_unroll_or_fold_hint(ctx):
    # Per-row varying enum props are inexpressible in a template; the message must
    # name the two valid moves.
    payload = _templated_surface(ctx)
    payload[1]["updateComponents"]["components"][2]["children"] = ["title", "ic"]
    payload[1]["updateComponents"]["components"].append(
        {"id": "ic", "component": "Icon", "name": {"path": "rowIcon"}}
    )
    with pytest.raises(ValueError, match="never be data-bound") as excinfo:
        ctx.validate_surface(payload)
    message = str(excinfo.value)
    assert "'name'" in message and "unroll" in message and "fold" in message


def test_dynamic_props_still_accept_bindings_alongside_literal_enums(ctx):
    # Text.text is Dynamic (bindable); variant is enum (literal). The pre-pass
    # must only reject the enum side.
    payload = _good_surface(ctx)
    payload[1]["updateComponents"]["components"][0]["children"] = ["greeting", "st"]
    payload[1]["updateComponents"]["components"].append(
        {
            "id": "st",
            "component": "Text",
            "text": {"path": "/stateText"},
            "variant": "caption",
        }
    )
    payload.append(
        {
            "version": "v0.9",
            "updateDataModel": {
                "surfaceId": "s1",
                "path": "/",
                "value": {"stateText": "Open"},
            },
        }
    )
    ctx.validate_surface(payload)  # must not raise


def test_validate_surface_rejects_an_absolute_item_path_with_relative_hint(ctx):
    payload = _templated_surface(ctx)
    payload[1]["updateComponents"]["components"][3]["text"] = {"path": "/title"}
    with pytest.raises(ValueError, match="RELATIVE"):
        ctx.validate_surface(payload)


def test_validate_surface_rejects_an_unresolvable_binding(ctx):
    payload = _templated_surface(ctx)
    payload[1]["updateComponents"]["components"][3]["text"] = {"path": "missing"}
    with pytest.raises(ValueError, match="does not resolve"):
        ctx.validate_surface(payload)


def test_validate_surface_rejects_a_template_path_that_is_not_a_list(ctx):
    payload = _templated_surface(ctx)
    payload[2]["updateDataModel"]["value"] = {"pulls": "not-a-list"}
    with pytest.raises(ValueError, match="does not resolve to a list"):
        ctx.validate_surface(payload)
