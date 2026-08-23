import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Token, props-only.
 *
 * Faithful 1:1 translation of Primer Token's real prop surface (TokenBaseProps + leadingVisual):
 * - `text` is the required content label (Primer types it React.ReactNode; the A2UI faithful
 *   translation of a text value is a DynamicString — literal or binding).
 * - `leadingVisual` is Primer's element-typed slot rendered before the text; the faithful A2UI
 *   translation of an element slot is a ComponentId child (typically an Icon). Not rendered at
 *   the small size.
 * - `removeAction` is the synthetic A2UI Action carrying Primer's `onRemove`; the binder resolves
 *   it to a ready-to-call () => void (event vs functionCall routing is the renderer's job).
 *   Omitting it renders no remove button.
 * - `as` is Primer's polymorphic element enum lifted verbatim (documented default "span" surfaces
 *   only in catalog.json).
 * - `hideRemoveButton`/`isSelected`/`disabled` are bound runtime state -> DynamicBoolean.
 * - Primer's `id` prop is NOT carried: the A2UI component envelope already owns every component's
 *   `id` (framework-owned, forbidden as a props-only schema field), and it serves as the token's
 *   identifier. See catalog.parity ENVELOPE_FIELDS.
 * - `size` is Primer's enum lifted verbatim.
 * - `accessibility` is carried because Token spreads the host element's aria-* slice; it maps to
 *   CommonSchemas.AccessibilityAttributes.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TokenApi = {
  name: 'Token',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      leadingVisual: CommonSchemas.ComponentId.optional(),
      as: z.enum(['span', 'button', 'a']).optional(),
      removeAction: CommonSchemas.Action.optional(),
      hideRemoveButton: CommonSchemas.DynamicBoolean.optional(),
      isSelected: CommonSchemas.DynamicBoolean.optional(),
      size: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type TokenProps = z.infer<typeof TokenApi.schema>;
