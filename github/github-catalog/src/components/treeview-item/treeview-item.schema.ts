import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer TreeView.Item, props-only. A single row in a tree — a
 * label with optional leading/trailing visuals, an expandable nested subtree, and a row of
 * secondary actions.
 *
 * Two interaction axes (family convention, see tree-view.md):
 * - **Expansion**: `expanded` is a two-way-bound `DynamicBoolean` — the generic binder generates a
 *   `setExpanded` setter and the render wires the item's twisty toggle back to the bound path
 *   (folds `onExpandedChange`, as `Checkbox` folds `onChange`->`checked`). Primer's
 *   `defaultExpanded`/`expanded === null` are not modeled (the bound path's initial value is the
 *   default; leaf-ness comes from the absence of a `SubTree` child).
 * - **Selection**: `action` is the side-effect (<- `onSelect`) -> `Action`; because it accepts the
 *   `event` shape, `Item` has an agent section.
 *
 * - `children` (required) -> `ChildList`: the item's label (a `Text` leaf) alongside its
 *   `LeadingVisual`/`TrailingVisual` and nested `SubTree`, as Primer composes them.
 * - `current` is bound display state -> `DynamicBoolean` (default false in `catalog.json`).
 * - `secondaryActions` is a structured array of inline trailing icon-buttons; the `GenericBinder`
 *   resolves `Action`/`Dynamic*` at any depth and passes the `icon` `ComponentId` through for
 *   `buildChild`.
 * - `containIntrinsicSize` is a plain-string layout-size hint for very large trees.
 *
 * The item's stable `id` (Primer's identifier, tracking expanded state and anchoring ARIA) is the
 * A2UI component-envelope `id`, required on every component and read from context at render — not a
 * duplicate schema prop (the framework strips `id`/`component` from props, message-processor.js:235,
 * and the catalog parity test treats `id` as an envelope field).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TreeViewItemApi = {
  name: 'TreeViewItem',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      expanded: CommonSchemas.DynamicBoolean.optional(),
      current: CommonSchemas.DynamicBoolean.optional(),
      action: CommonSchemas.Action.optional(),
      secondaryActions: z
        .array(
          z.object({
            label: CommonSchemas.DynamicString,
            icon: CommonSchemas.ComponentId,
            count: CommonSchemas.DynamicString.optional(),
            action: CommonSchemas.Action,
          }),
        )
        .optional(),
      containIntrinsicSize: z.string().optional(),
    })
    .strict(),
} as const;

export type TreeViewItemProps = z.infer<typeof TreeViewItemApi.schema>;
