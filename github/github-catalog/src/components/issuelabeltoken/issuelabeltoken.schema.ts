import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer IssueLabelToken, props-only.
 *
 * Faithful 1:1 translation of Primer IssueLabelToken's real prop surface
 * (TokenBaseProps + fillColor; no leadingVisual — that prop is Token-only):
 * - `text` is the required content label -> DynamicString (literal or binding).
 * - `fillColor` is the label color the token derives its fill and text from -> DynamicString.
 * - `removeAction` is the synthetic A2UI Action carrying Primer's `onRemove`; the binder resolves
 *   it to a ready-to-call () => void. Omitting it renders no remove button.
 * - `as` is Primer's polymorphic element enum lifted verbatim (documented default "span" surfaces
 *   only in catalog.json).
 * - `hideRemoveButton`/`isSelected`/`disabled` are bound runtime state -> DynamicBoolean.
 * - Primer's `id` prop is NOT carried: the A2UI component envelope already owns every component's
 *   `id` (framework-owned, forbidden as a props-only schema field), and it serves as the token's
 *   identifier. See catalog.parity ENVELOPE_FIELDS.
 * - `size` is Primer's enum lifted verbatim.
 * - `accessibility` is carried because the token spreads the host element's aria-* slice; it maps
 *   to CommonSchemas.AccessibilityAttributes.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const IssueLabelTokenApi = {
  name: 'IssueLabelToken',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      fillColor: CommonSchemas.DynamicString.optional(),
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

export type IssueLabelTokenProps = z.infer<typeof IssueLabelTokenApi.schema>;
