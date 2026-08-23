import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {spacing, sizeWidth} from '../../shared/page-layout';

/**
 * Runtime (zod) representation of Primer PageLayout, props-only. The root of the compound family:
 * it arranges five optional regions (each its own catalog leaf) plus the container-level scale
 * props.
 *
 * - The five regions — `header` / `content` / `pane` / `sidebar` / `footer` — are each a named
 *   synthetic `ComponentId` slot (the Details `summary`-slot idiom). Primer auto-slots its regions
 *   by scanning children for `useSlots` markers; A2UI's `buildChild` returns an opaque
 *   `DeferredChild` that hides those markers, so a generic child list cannot be slotted. Naming each
 *   region as its own `ComponentId` lets the render know each region's identity and bridge the
 *   identity-slotted ones (`header`/`footer`/`sidebar`) back onto Primer's scanner with `asSlot`.
 *   All five are optional — a layout may supply any subset; the single-`ComponentId`-per-slot shape
 *   structurally prevents the duplicate-region case Primer warns on.
 * - `containerWidth` / `padding` / `rowGap` / `columnGap` are fixed authoring-time scale config —
 *   plain enums (no `Dynamic*`). Defaults live in `catalog.json`, never as a zod `.default()`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const PageLayoutApi = {
  name: 'PageLayout',
  schema: z
    .object({
      header: CommonSchemas.ComponentId.optional(),
      content: CommonSchemas.ComponentId.optional(),
      pane: CommonSchemas.ComponentId.optional(),
      sidebar: CommonSchemas.ComponentId.optional(),
      footer: CommonSchemas.ComponentId.optional(),
      containerWidth: sizeWidth().optional(),
      padding: spacing().optional(),
      rowGap: spacing().optional(),
      columnGap: spacing().optional(),
    })
    .strict(),
} as const;

export type PageLayoutProps = z.infer<typeof PageLayoutApi.schema>;
