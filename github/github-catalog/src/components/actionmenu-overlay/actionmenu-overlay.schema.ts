import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `ActionMenu.Overlay` (component name `ActionMenu.Overlay`),
 * props-only. The floating surface holding the menu's options, positioned relative to the trigger.
 * Part of the `ActionMenu` compound family (6.39); see `_dev/docs/new-components/actionmenu-overlay.md`.
 *
 * `MenuOverlayProps = Partial<OverlayProps> & Pick<AnchoredOverlayProps, 'align'|'side'|'variant'|
 * 'displayInViewport'> & {children, onPositionChange?}`. The menu's positioning surface — a `Pick`
 * of the `AnchoredOverlay` (6.55) positioning props plus the discrete `Overlay` sizing enums.
 *
 * - `children` is the synthetic primary slot (required) -> ChildList: the menu content (an
 *   `ActionList` plus optional `ActionMenu.Divider`s).
 * - `align`/`side` are the placement enums; `variant` is the narrow-screen presentation;
 *   `displayInViewport` keeps the menu within the viewport bounds.
 * - `width`/`height`/`maxHeight`/`maxWidth` are the discrete `Overlay` sizing enums (`widthMap`/
 *   `heightMap`); a longer list capped by `maxHeight` scrolls.
 *
 * `.strict()` forbids any prop outside this surface. Dropped/deferred: `onPositionChange`
 * (observational layout readback) and the untyped remainder of `Partial<OverlayProps>` (passthrough
 * bag — the `AnchoredOverlay` precedent; the discrete sizing it reaches is carried directly).
 */
export const ActionMenuOverlayApi = {
  name: 'ActionMenu.Overlay',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      align: z.enum(['start', 'center', 'end']).optional(),
      side: z
        .enum([
          'outside-bottom',
          'outside-top',
          'outside-left',
          'outside-right',
          'inside-top',
          'inside-bottom',
          'inside-left',
          'inside-right',
          'inside-center',
        ])
        .optional(),
      variant: z.enum(['anchored', 'fullscreen']).optional(),
      displayInViewport: z.boolean().optional(),
      width: z.enum(['small', 'medium', 'large', 'xlarge', 'xxlarge', 'auto']).optional(),
      height: z
        .enum(['xsmall', 'small', 'medium', 'large', 'xlarge', 'auto', 'initial', 'fit-content'])
        .optional(),
      maxHeight: z.enum(['xsmall', 'small', 'medium', 'large', 'xlarge', 'fit-content']).optional(),
      maxWidth: z.enum(['small', 'medium', 'large', 'xlarge', 'xxlarge']).optional(),
    })
    .strict(),
} as const;

export type ActionMenuOverlayProps = z.infer<typeof ActionMenuOverlayApi.schema>;
