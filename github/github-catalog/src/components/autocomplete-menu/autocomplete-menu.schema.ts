import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * The shape of one `Autocomplete.Menu` suggestion. `items` is an authoring-time DATA array
 * (faithful to Primer's data-driven `items` API), so scalar fields are plain (`z.string()` /
 * `z.boolean()` / `z.enum`); the reference fields (`leadingVisual` / `trailingVisual`) are
 * `ComponentId` icons the render builds via `buildChild` (the `ActionBar.Menu` item convention).
 *
 * Selection machinery, child-slot composition and per-row runtime state are dropped from the item:
 * selection is Menu-level (`selectedItemIds` / `onSelectedChange`), and a static suggestion list has
 * no per-row runtime state.
 */
const menuItemShape = {
  id: z.string(),
  text: z.string().optional(),
  leadingVisual: CommonSchemas.ComponentId.optional(),
  trailingVisual: CommonSchemas.ComponentId.optional(),
  disabled: z.boolean().optional(),
  variant: z.enum(['default', 'danger']).optional(),
};

export const autocompleteMenuItemSchema = z.object(menuItemShape).strict();

/**
 * Runtime (zod) representation of Primer `Autocomplete.Menu` (exported as `AutocompleteMenu`),
 * props-only. The filter/selection engine: Primer runs its own case-insensitive substring filter and
 * selected-to-top sort-on-close over the `items` data array, so modeling suggestions as child
 * components would fight the component.
 *
 * - `items` is the required authored suggestion array (see the item shape above).
 * - `selectedItemIds` is the selection state, two-way bound (the `Select.value`/`Checkbox.checked`
 *   pattern generalized to an array): `onSelectedChange` writes the new `string[]` back through the
 *   binder's auto-generated `setSelectedItemIds`. There is no `DynamicList`, so the type is a union
 *   of the array + `DataBinding`. Optional — absence means empty (nothing selected).
 * - `selectionVariant` chooses single vs multiple selection (default `single`, surfaced in
 *   catalog.json).
 * - `emptyStateText` is the no-matches message (`DynamicString`, default "No selectable options").
 * - `loading` shows the menu's loading indicator (`DynamicBoolean`).
 * - `addNewItem` is the "create a value not in the list" row: an item object plus an `Action`
 *   (`action`, fired when the row is chosen). `Action` context is authored, not per-invocation, so
 *   the live typed value is read from the input's two-way-bound `value` path, not delivered here.
 * - `accessibility` supplies the options list's accessible name (the `aria-labelledby` requirement).
 *
 * Dropped: `onSelectedChange` (represented by the `selectedItemIds` write-back), `onOpenChange`
 * (menu open/close is internally managed and fires incidentally), `filterFn`/`sortOnCloseFn`
 * (function-typed; Primer's defaults kept), `customScrollContainerRef` (ref-typed), per-item
 * `metadata` (opaque passthrough).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const AutocompleteMenuApi = {
  name: 'Autocomplete.Menu',
  schema: z
    .object({
      items: z.array(autocompleteMenuItemSchema),
      selectedItemIds: z.union([z.array(z.string()), CommonSchemas.DataBinding]).optional(),
      selectionVariant: z.enum(['single', 'multiple']).optional(),
      emptyStateText: CommonSchemas.DynamicString.optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      addNewItem: z
        .object({...menuItemShape, action: CommonSchemas.Action})
        .strict()
        .optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type AutocompleteMenuProps = z.infer<typeof AutocompleteMenuApi.schema>;
