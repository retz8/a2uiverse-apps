import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Autocomplete.Overlay` (exported as `AutocompleteOverlay`),
 * props-only. A pure structural container mirroring Primer's `<Autocomplete.Overlay>` wrapper — the
 * `children` slot holds the Menu; the panel auto-positions against the input via the Autocomplete
 * context.
 *
 * - `children` is the synthetic content channel (`ChildList`) holding the suggestion Menu.
 *
 * Dropped: `menuAnchorRef` (ref-typed; the panel auto-positions against the input via context),
 * `overlayProps` (`@deprecated` untyped passthrough bag), and the entire `Partial<OverlayProps>`
 * spread (`width`/`height`/`maxHeight`/`visibility`/`anchorSide`/`aria-labelledby`/…) — incidentally
 * inherited from the `Overlay` component, not documented on `Autocomplete.Overlay`'s own surface, so
 * dropped per per-component fidelity.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const AutocompleteOverlayApi = {
  name: 'Autocomplete.Overlay',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type AutocompleteOverlayProps = z.infer<typeof AutocompleteOverlayApi.schema>;
