import {useContext, type ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SelectPanelItemApi} from './selectpanel-item.schema.js';
import {SelectPanelItemVisualContext} from '../../shared/selectpanel-item-visual-context.js';

/**
 * `SelectPanel.Item` is a **data-carrier leaf**, not a self-rendering component. Primer's
 * `SelectPanel` renders its rows from an `items: ItemInput[]` data array rather than from React
 * children, so the parent `SelectPanel` render fn reads each `SelectPanel.Item`'s props off the
 * surface model (`context.surfaceComponents`) and maps them to one Primer `ItemInput` (see
 * `selectpanel.tsx`). The item is built only into its row's visual slots, where it draws the one
 * visual asked of it; it exists so the leaf is a first-class catalog component (schema, registry,
 * `catalog.json`).
 */
export function SelectPanelItemView({
  leadingVisual,
  trailingVisual,
}: {
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
}) {
  const visual = useContext(SelectPanelItemVisualContext);
  if (visual === 'leadingVisual') return leadingVisual ?? null;
  if (visual === 'trailingVisual') return trailingVisual ?? null;
  return null;
}

/**
 * Catalog entry: the item never renders standalone (its parent consumes its props as `items`
 * data); built into a visual slot it draws that visual. Its selection two-way write-back and
 * `action` dispatch are performed by the `SelectPanel` render fn, which owns the items data.
 */
export const SelectPanelItemComponent = createComponentImplementation(
  SelectPanelItemApi,
  ({props, buildChild}) => (
    <SelectPanelItemView
      leadingVisual={props.leadingVisual ? buildChild(props.leadingVisual) : undefined}
      trailingVisual={props.trailingVisual ? buildChild(props.trailingVisual) : undefined}
    />
  ),
);
