import {createContext} from 'react';

/**
 * The per-segment slot data the parent `SegmentedControl` provides to each segment leaf
 * (`SegmentedControl.Button` / `SegmentedControl.IconButton`).
 *
 * A2UI centralizes selection on the container as a single `selectedIndex`, so the segment leaves
 * carry no `selected` prop of their own — a segment's selected-ness is derived from the parent
 * index and pushed down here. `onSelect` is the parent's click handler for that positional slot:
 * it writes the clicked index back to `selectedIndex`'s bound path (the optimistic two-way write)
 * and then fires the container's optional change `action`.
 *
 * The a2ui renderer resolves each child independently (a `DeferredChild` wrapper), so the parent
 * cannot reach through to Primer's own child-cloning to inject `selected`/`onClick`; this context
 * is the channel that carries them across that boundary.
 */
export type SegmentSlot = {
  /** Whether this segment is the currently-selected one (`index === selectedIndex`). */
  selected: boolean;
  /** Selects this segment: writes its index back to `selectedIndex` and fires the container action. */
  onSelect: () => void;
};

export const SegmentSlotContext = createContext<SegmentSlot | null>(null);
