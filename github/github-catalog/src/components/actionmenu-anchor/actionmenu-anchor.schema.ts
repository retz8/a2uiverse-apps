import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `ActionMenu.Anchor` (component name `ActionMenu.Anchor`),
 * props-only. A custom element used as the menu's trigger, when a plain button is not wanted. Part
 * of the `ActionMenu` compound family (6.39); see `_dev/docs/new-components/actionmenu-anchor.md`.
 *
 * `ActionMenuAnchorProps = {children: React.ReactElement, id?} & React.HTMLAttributes`. The single
 * required `children` element is carried as the synthetic `child` (a `ComponentId`) — the component
 * used as the menu's trigger. Primer wires the toggle onto the wrapper, so the wrapped component is
 * presentational (its own action, if any, is redundant — the trigger's click is owned by the parent
 * `ActionMenu`).
 *
 * `.strict()` forbids any prop outside this surface. Dropped/deferred: `id` and the non-`aria-*`
 * `React.HTMLAttributes<HTMLElement>` spread (no A2UI representation).
 */
export const ActionMenuAnchorApi = {
  name: 'ActionMenu.Anchor',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
    })
    .strict(),
} as const;

export type ActionMenuAnchorProps = z.infer<typeof ActionMenuAnchorApi.schema>;
