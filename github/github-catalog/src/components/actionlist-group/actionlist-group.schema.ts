import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.Group, props-only (component name
 * `ActionList.Group`). A labeled section grouping related items, optionally with its own selection
 * mode. See `_dev/docs/new-components/action-list-group.md`.
 *
 * - `children` is the synthetic `ChildList` — the items contained in the group.
 * - `variant` is a Primer enum lifted verbatim; `auxiliaryText` is a bound display value ->
 *   `DynamicString`; `role` is ARIA wiring -> plain string. Defaults live in `catalog.json`.
 * - `selectionVariant` resolves to `single | radio | multiple | false` (the doc's table omits
 *   `radio`; code is authority, carried); `false` disables selection for this group. It is a union
 *   of the enum with the `false` literal.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListGroupApi = {
  name: 'ActionList.Group',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      variant: z.enum(['filled', 'subtle']).optional(),
      auxiliaryText: CommonSchemas.DynamicString.optional(),
      selectionVariant: z
        .union([z.enum(['single', 'radio', 'multiple']), z.literal(false)])
        .optional(),
      role: z.string().optional(),
    })
    .strict(),
} as const;

export type ActionListGroupProps = z.infer<typeof ActionListGroupApi.schema>;
