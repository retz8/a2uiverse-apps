import {createComponentImplementation} from '@a2ui/react/v0_9';
import {SelectPanelItemApi} from './selectpanel-item.schema';

/**
 * `SelectPanel.Item` is a **data-carrier leaf**, not a self-rendering component. Primer's
 * `SelectPanel` renders its rows from an `items: ItemInput[]` data array rather than from React
 * children, so the parent `SelectPanel` render fn reads each `SelectPanel.Item`'s resolved props
 * off the surface model (`context.surfaceComponents`) and maps them to one Primer `ItemInput`
 * (see `selectpanel.tsx`). The item is therefore never built via `buildChild` and this render is
 * never invoked in practice; it exists so the leaf is a first-class catalog component (schema,
 * registry, `catalog.json`) and renders nothing on its own.
 */
export function SelectPanelItemView() {
  return null;
}

/**
 * Catalog entry: the item never renders standalone (its parent consumes its resolved props as
 * `items` data), so the implementation renders nothing. Its selection two-way write-back and
 * `action` dispatch are performed by the `SelectPanel` render fn, which owns the items data.
 */
export const SelectPanelItemComponent = createComponentImplementation(SelectPanelItemApi, () => (
  <SelectPanelItemView />
));
