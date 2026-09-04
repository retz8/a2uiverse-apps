"""The live mode's mutable listing (task-4.6 decision 13).

`live` runs the model over a store it can actually change, so a reorder genuinely
reorders and a later listing call reflects it. `stub` runs the same tools against a
frozen copy, acknowledging writes and changing nothing — which is the kit's stub
semantics and what gives stub a job for an app that has no vendor to stub out.

The state is process-level rather than per-conversation: a mock is a single-tenant dev
instrument, started per run, so the two coincide. It is rebuilt from the dataset at
import and never written back to disk.
"""

from __future__ import annotations

from app import dataset


class Listing:
    """This store's listing, in whatever order it is currently in."""

    def __init__(self, *, mutable: bool) -> None:
        self._mutable = mutable
        self._items = dataset.catalogue()

    @property
    def items(self) -> list[dict]:
        return [dict(item) for item in self._items]

    def sort(self, key: str) -> list[dict]:
        """Reorders the listing. Frozen listings acknowledge and change nothing."""
        ordered = dataset.sorted_catalogue(key, self._items)
        if self._mutable:
            self._items = ordered
            return self.items
        return self.items

    def reset(self) -> list[dict]:
        self._items = dataset.catalogue()
        return self.items


LIVE_LISTING = Listing(mutable=True)
STUB_LISTING = Listing(mutable=False)
