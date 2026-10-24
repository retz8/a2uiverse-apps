"""Local fixes over the pinned upstream releases, each applied once, at import.

Each fix answers a finding reported upstream and goes when a release carries the fix
(a2uiverse `_dev/a2ui-findings.md`).
"""

from __future__ import annotations

from a2ui.core.common import to_protocol_version
from a2ui.core.schema import ProtocolVersion
from a2ui.core.state.component_model import ComponentModel

_heuristic_child_references = ComponentModel.get_child_references


def _child_references(self, known_component_ids=None, catalog=None):
    """A component's child references, from its catalog's reference spec alone from v0.9.

    `a2ui-core` 0.4.0 falls back to its v0.8 heuristic — any string prop whose value is a
    known component id is a child — for every component whose spec declares no reference
    props, on any surface: an `Icon` named "mail" inside a `Row` whose id is `mail` reads
    as a cycle, and the surface is refused (finding 16). From v0.9 a component the catalog
    declares is read by its spec; the heuristic keeps v0.8 and components no spec covers.
    """
    target = catalog if catalog is not None else self.catalog
    if target is not None and hasattr(target, "get_component_ref_spec"):
        if to_protocol_version(target.protocol_version) is not ProtocolVersion.V0_8:
            spec = target.get_component_ref_spec(self.type)
            if spec is not None:
                if isinstance(self.properties, dict):
                    yield from spec.extract_child_references(self.properties)
                return
    yield from _heuristic_child_references(self, known_component_ids, catalog)


ComponentModel.get_child_references = _child_references
