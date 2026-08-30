"""Live-agent catalog access: examples-wired schema manager + strict surface validation."""

from __future__ import annotations

import functools
from pathlib import Path

from a2ui.schema.catalog import A2uiCatalog
from a2ui.schema.manager import A2uiSchemaManager
from a2ui.schema.validator import analyze_topology, extract_component_ref_fields

from catalog_common import build_schema_manager

# agent/knowledge/examples — the 7.1 curated idiom examples, registered as the
# catalog's examples path so generate_system_prompt(include_examples=True) finds them.
EXAMPLES_DIR = Path(__file__).resolve().parents[1] / "knowledge" / "examples"


@functools.lru_cache(maxsize=1)
def live_schema_manager() -> A2uiSchemaManager:
    return build_schema_manager(examples_path=str(EXAMPLES_DIR))


def live_catalog() -> A2uiCatalog:
    return live_schema_manager().get_selected_catalog()


@functools.lru_cache(maxsize=1)
def live_ref_fields() -> dict:
    """Component-reference field map of the live catalog (e.g. PageLayout's
    header/content/pane), for topology traversal without the full catalog."""
    return extract_component_ref_fields(live_catalog())


# NOTE: the GitHub agent strips the `id` envelope before schema conformance, because
# Primer's hand-written catalog does not model `id` on its components. The basic catalog
# does — every component `$ref`s ComponentCommon, where `id` is REQUIRED — so stripping it
# here would fail every component in every surface. Conformance runs on the id-retained
# tree, like topology.


_MISSING = object()


def _flatten_props(schema: dict) -> dict[str, dict]:
    """Collects a component's declared properties through `allOf` composition.

    Primer's hand-written catalog declares `properties` at the top level; the basic catalog
    composes each component out of `allOf` branches (ComponentCommon, CatalogComponentCommon,
    then its own). Reading only the top level finds nothing there, which silently disables the
    enum/literal pre-pass below — the model would then get the raw schema error instead of the
    message naming the valid move. Both shapes are walked.
    """
    props: dict[str, dict] = dict(schema.get("properties") or {})
    for branch in schema.get("allOf") or []:
        if isinstance(branch, dict):
            props.update(_flatten_props(branch))
    return props


@functools.lru_cache(maxsize=1)
def _component_prop_schemas() -> dict[str, dict[str, dict]]:
    """Per-component property schemas of the live catalog: name -> {prop: schema}."""
    components = live_catalog().catalog_schema.get("components", {})
    return {
        name: _flatten_props(schema)
        for name, schema in components.items()
        if isinstance(schema, dict)
    }


def _is_dynamic_schema(prop_schema: dict) -> bool:
    """Whether a prop schema is a Dynamic* common type (bindable), directly or
    through a combinator."""
    ref = prop_schema.get("$ref", "")
    if isinstance(ref, str) and "/$defs/Dynamic" in ref:
        return True
    for key in ("anyOf", "oneOf", "allOf"):
        for sub in prop_schema.get(key) or []:
            if isinstance(sub, dict) and _is_dynamic_schema(sub):
                return True
    return False


def _check_no_bindings_on_literal_props(components: list[dict]) -> None:
    """Rejects a `{path}` binding on any prop whose schema is not a Dynamic* type.

    Enum/literal props (StateLabel.status, Icon.fill/name, ...) can never carry a
    binding — the protocol has no DynamicEnum — and the generic schema error the
    catalog validator raises ("{'path': ...} is not of type 'string'") tells the
    retrying model that it is wrong but not what the valid move is. This pre-pass
    names the move. Unknown components and undeclared props stay with pass 1.
    """
    prop_schemas = _component_prop_schemas()
    for component in components:
        schemas = prop_schemas.get(component.get("component"))
        if not schemas:
            continue
        for key, value in component.items():
            if key in ("id", "component", "children"):
                continue
            schema = schemas.get(key)
            if schema is None or _is_dynamic_schema(schema) or not _is_binding(value):
                continue
            message = (
                f"property {key!r} of component '{component.get('id')}' "
                f"({component.get('component')}) is enum/literal-typed and can "
                "never be data-bound; write a literal value chosen from the tool "
                "result"
            )
            allowed = schema.get("enum")
            if allowed:
                message += f". Allowed values: {', '.join(map(str, allowed))}"
            message += (
                ". If the value varies per template row, unroll the rows as "
                "individually authored components, or fold the state into a bound "
                "text field."
            )
            raise ValueError(message)


def _is_binding(value: object) -> bool:
    """A `{path: ...}` data-binding reference (a template children decl is not one)."""
    return (
        isinstance(value, dict)
        and isinstance(value.get("path"), str)
        and "componentId" not in value
    )


def _iter_binding_paths(value: object):
    """Yields every binding path nested anywhere inside a prop value."""
    if _is_binding(value):
        yield value["path"]
    elif isinstance(value, dict):
        for v in value.values():
            yield from _iter_binding_paths(v)
    elif isinstance(value, list):
        for v in value:
            yield from _iter_binding_paths(v)


def _set_data_path(root: dict, path: str, value: object) -> None:
    segments = [s for s in path.split("/") if s]
    if not segments:
        if isinstance(value, dict):
            root.update(value)
        return
    cursor = root
    for segment in segments[:-1]:
        nxt = cursor.get(segment) if isinstance(cursor, dict) else None
        if not isinstance(nxt, (dict, list)):
            nxt = {}
            cursor[segment] = nxt
        cursor = nxt
    if isinstance(cursor, dict):
        cursor[segments[-1]] = value


def _build_data_model(messages: list[dict]) -> dict:
    model: dict = {}
    for message in messages:
        update = message.get("updateDataModel") if isinstance(message, dict) else None
        if isinstance(update, dict):
            _set_data_path(model, update.get("path") or "/", update.get("value"))
    return model


def _resolve_data_path(path: str, context: object, root: object) -> object:
    """Follows `path` (absolute from `root` when it leads with '/', else from
    `context`); returns _MISSING when any segment does not exist."""
    cursor = root if path.startswith("/") else context
    for segment in (s for s in path.split("/") if s):
        if isinstance(cursor, dict) and segment in cursor:
            cursor = cursor[segment]
        elif isinstance(cursor, list) and segment.isdigit() and int(segment) < len(cursor):
            cursor = cursor[int(segment)]
        else:
            return _MISSING
    return cursor


def _check_bindings_resolve(components: list[dict], data_model: dict) -> None:
    """Walks the final component tree from root, resolving every binding against the
    data model — template subtrees resolve against each list item's context."""
    by_id: dict[str, dict] = {c["id"]: c for c in components if "id" in c}

    def walk(component_id: str, context: object, in_template: bool) -> None:
        component = by_id.get(component_id)
        if component is None:  # dangling refs are the topology pass's finding
            return
        for key, value in component.items():
            if key in ("id", "component", "children"):
                continue
            for path in _iter_binding_paths(value):
                if _resolve_data_path(path, context, data_model) is not _MISSING:
                    continue
                message = (
                    f"binding {path!r} on component "
                    f"'{component_id}' ({component.get('component')}) does not resolve "
                    "to a value in the surface's data model"
                )
                relative = path.lstrip("/")
                if (
                    in_template
                    and path.startswith("/")
                    and _resolve_data_path(relative, context, data_model) is not _MISSING
                ):
                    message += (
                        f"; inside a list template, bind item fields with a RELATIVE "
                        f"path — use {relative!r}, not {path!r}"
                    )
                raise ValueError(message)
        children = component.get("children")
        if isinstance(children, list):
            for child_id in children:
                walk(child_id, context, in_template)
        elif isinstance(children, dict) and "componentId" in children:
            list_path = children.get("path") or ""
            items = _resolve_data_path(list_path, context, data_model)
            if items is _MISSING or not isinstance(items, list):
                raise ValueError(
                    f"template children of '{component_id}' bind to {list_path!r}, "
                    "which does not resolve to a list in the surface's data model"
                )
            for item in items:
                walk(children["componentId"], item, True)

    walk("root", data_model, False)


def validate_surface(payload: list[dict] | dict) -> None:
    """Validates a *complete* A2UI surface against the Calendar catalog, on the live
    agent's own terms.

    Four passes, because the catalog does not model the framework-owned `id` field:

    0. Binding-on-literal-prop pre-pass: a `{path}` binding on a non-Dynamic prop
       (StateLabel.status, Icon.fill/name, ...) is rejected with a targeted message
       naming the fix — before pass 1's generic type error can bury it.
    1. Component conformance — id-stripped, non-strict: every component matches its
       catalog schema (no undeclared properties, known component types, correct types).
    2. Completeness/topology — on the id-retained tree: the payload declares a
       createSurface, contains a component with id='root', and every component is
       reachable from the root (no dangling references, no orphans).
    3. Binding resolvability: every binding on the final tree resolves against the
       final data model, with template subtrees resolved per list item — path
       semantics (relative item paths vs absolute root paths) are invisible to the
       schema conformance of pass 1, so they are checked here. (Bindings on
       literal-typed props like Icon.name are already rejected by pass 1's type
       check.)

    This is stronger than the deterministic agent's non-strict partial-update probe,
    which deliberately skips the root/orphan checks (its root lives in a client fixture).
    Raises ValueError on any conformance, completeness, topology, or binding failure.
    """
    messages = payload if isinstance(payload, list) else [payload]
    catalog = live_catalog()

    components: list[dict] = []
    for message in messages:
        update = message.get("updateComponents") if isinstance(message, dict) else None
        if isinstance(update, dict):
            components.extend(
                c for c in update.get("components", []) if isinstance(c, dict)
            )

    # Pass 0: bindings on non-Dynamic props, with the actionable message.
    _check_no_bindings_on_literal_props(components)

    # Pass 1: component-schema conformance.
    catalog.validator.validate(messages, strict_integrity=False)

    # Pass 2: completeness + topology on the id-retained tree.
    has_create = any(
        isinstance(m, dict) and "createSurface" in m for m in messages
    )
    if not has_create:
        raise ValueError("incomplete surface: no createSurface message")

    if not components:
        raise ValueError("incomplete surface: no components in updateComponents")

    ids = {c.get("id") for c in components}
    if "root" not in ids:
        raise ValueError("incomplete surface: no component with id='root'")

    ref_map = extract_component_ref_fields(catalog)
    analyze_topology("root", components, ref_map, raise_on_orphans=True)

    # Pass 3: binding resolvability on the final state.
    _check_bindings_resolve(components, _build_data_model(messages))
