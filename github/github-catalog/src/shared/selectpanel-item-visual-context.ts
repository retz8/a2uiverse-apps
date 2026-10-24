import {createContext} from 'react';

/**
 * Which of its visuals an item draws: set by `SelectPanel`, which builds the item once inside each
 * visual slot of the row Primer draws for it — a parent builds only its own children, so the item
 * builds its icons itself. Unset, the item draws nothing.
 */
export const SelectPanelItemVisualContext = createContext<
  'leadingVisual' | 'trailingVisual' | null
>(null);
