import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `AnchoredOverlay`, props-only. A trigger element that opens
 * a floating panel positioned relative to itself; the panel can be opened and dismissed by keyboard
 * or mouse.
 *
 * Self-contained overlay — no new infra: Primer's `AnchoredOverlay` portals the panel to the
 * document body and manages its own focus trap, Escape handling, and outside-click dismissal,
 * rendering through the normal adapter→renderer path (the `Dialog` precedent, 6.52).
 *
 * - `anchor` is the synthetic primary slot, tightened to REQUIRED: without a trigger the component
 *   has nothing to position against. It is a `ComponentId` resolved with `buildChild` and wrapped in
 *   a ref-bearing element handed to Primer's `renderAnchor`; the referenced component renders inside
 *   as the visible, presentational trigger (its own `action`, if any, is redundant there).
 * - `open` is the controlled visibility state -> DynamicBoolean (required). Two-way bound like
 *   Checkbox's `checked`: the binder auto-generates `setOpen`, and the trigger's open/close gestures
 *   write the new value back through it. An open-gesture calls `setOpen(true)` and fires `onOpen` if
 *   present; a close-gesture calls `setOpen(false)` and fires `onClose` if present. The state flip is
 *   automatic, so the leaf toggles standalone.
 * - `onOpen`/`onClose` are the optional flexible hooks (a `functionCall` or agent `event`) layered
 *   on the automatic flip; neither forwards the library callback's gesture parameter (`Action`
 *   context is authored, not per-invocation — the Dialog `closeAction` precedent).
 * - `children` are the panel's content -> ChildList.
 * - `side`/`align` are the placement enums; `anchorOffset`/`alignmentOffset` the pixel offsets;
 *   `displayInViewport` keeps the panel within the viewport bounds.
 * - `height`/`width` are the Overlay sizing presets (plus content-driven `auto`/`initial`/
 *   `fit-content`).
 * - `preventOverflow`/`pinPosition` are positioning behaviors.
 * - `variant` projects `ResponsiveValue<'anchored', 'anchored'|'fullscreen'>` — whose `regular` arm
 *   is fixed to `'anchored'` — to a flat enum over the only author-variable arm (`narrow`); the
 *   render fn maps `'fullscreen'` → `{narrow: 'fullscreen'}`. `displayCloseButton` shows a close
 *   button in the fullscreen-narrow presentation.
 *
 * `.strict()` forbids any prop outside this surface. Dropped/deferred: `renderAnchor`/`anchorRef`/
 * `anchorId` (function/ref/id-typed anchor wiring — represented by the synthetic `anchor`),
 * `onPositionChange` (observational layout readback), `focusTrapSettings`/`focusZoneSettings`
 * (hook-settings bags with refs/callbacks), `overlayProps`/`closeButtonProps` (untyped passthrough
 * bags), `renderAs`/`cssAnchorPositioningSettings` (experimental DOM-strategy switch), `className`.
 */
export const AnchoredOverlayApi = {
  name: 'AnchoredOverlay',
  schema: z
    .object({
      anchor: CommonSchemas.ComponentId,
      open: CommonSchemas.DynamicBoolean,
      onOpen: CommonSchemas.Action.optional(),
      onClose: CommonSchemas.Action.optional(),
      children: CommonSchemas.ChildList.optional(),
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
      align: z.enum(['start', 'center', 'end']).optional(),
      anchorOffset: z.number().optional(),
      alignmentOffset: z.number().optional(),
      displayInViewport: z.boolean().optional(),
      height: z
        .enum(['xsmall', 'small', 'medium', 'large', 'xlarge', 'auto', 'initial', 'fit-content'])
        .optional(),
      width: z.enum(['small', 'medium', 'large', 'xlarge', 'xxlarge', 'auto']).optional(),
      preventOverflow: z.boolean().optional(),
      pinPosition: z.boolean().optional(),
      variant: z.enum(['anchored', 'fullscreen']).optional(),
      displayCloseButton: z.boolean().optional(),
    })
    .strict(),
} as const;

export type AnchoredOverlayProps = z.infer<typeof AnchoredOverlayApi.schema>;
