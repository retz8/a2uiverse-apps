import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `SplitPageLayout` (the Root), props-only.
 *
 * A named multi-slot container: a compound whose subcomponents occupy fixed, distinct regions maps
 * to one Root leaf carrying a named synthetic `ComponentId` slot per region (not a flat
 * `ChildList`). This preserves each region's identity and position — the agent cannot supply two
 * panes or route a raw component into the header. Each slot references the corresponding region
 * leaf (`SplitPageLayout.Header` / `.Content` / `.Pane` / `.Sidebar` / `.Footer`), whose own render
 * emits the real Primer subcomponent.
 *
 * The Root carries no configuration props: the split preset hardcodes `containerWidth`, `padding`,
 * `rowGap`, and `columnGap` in the `SplitPageLayout` wrapper. All five slots are optional, matching
 * Primer's optional children.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SplitPageLayoutApi = {
  name: 'SplitPageLayout',
  schema: z
    .object({
      header: CommonSchemas.ComponentId.optional(),
      content: CommonSchemas.ComponentId.optional(),
      pane: CommonSchemas.ComponentId.optional(),
      sidebar: CommonSchemas.ComponentId.optional(),
      footer: CommonSchemas.ComponentId.optional(),
    })
    .strict(),
} as const;

export type SplitPageLayoutProps = z.infer<typeof SplitPageLayoutApi.schema>;
