import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.TrailingAction, props-only (component name
 * `ActionList.TrailingAction`). A secondary action shown after an item's content, running an
 * action when clicked (button mode) or navigating when given a link target (link mode). See
 * `_dev/docs/new-components/action-list-trailingaction.md`.
 *
 * `TrailingAction` renders as a button (`as: "button"`, default) or a link (`as: "a"` + `href`);
 * the two modes are mutually exclusive in Primer's type, but the A2UI schema carries both channels
 * and stays permissive (the agent composes per `as`).
 *
 * - `icon` is the required content channel — an element-typed Primer slot carried as a
 *   `ComponentId` child (references an `Icon`).
 * - `label` is the required accessible name (and visible text in plain-button mode) ->
 *   `DynamicString`.
 * - `action` (<- `onClick`, optional) is the button-mode interaction -> `Action` (a local function
 *   or a server event); because it accepts the `event` shape, this leaf has an agent section.
 * - `as`/`href` cover the link mode; `loading` is bound runtime state (button mode) ->
 *   `DynamicBoolean`. Defaults live in `catalog.json`, never as zod `.default()`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListTrailingActionApi = {
  name: 'ActionList.TrailingAction',
  schema: z
    .object({
      icon: CommonSchemas.ComponentId,
      label: CommonSchemas.DynamicString,
      action: CommonSchemas.Action.optional(),
      as: z.enum(['button', 'a']).optional(),
      href: CommonSchemas.DynamicString.optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type ActionListTrailingActionProps = z.infer<typeof ActionListTrailingActionApi.schema>;
