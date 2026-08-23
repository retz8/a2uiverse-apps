import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Autocomplete` (the root of the compound family),
 * props-only.
 *
 * The root is a pure context/container leaf. Rendering the real `<Autocomplete>` wrapper lets
 * Primer's own React context (`inputValue`, `showMenu`, `activeDescendant`, selection) flow between
 * the `Autocomplete.Input` and `Autocomplete.Menu` sub-components nested inside it — no
 * reimplementation. Composition mirrors Primer exactly:
 * `<Autocomplete>` -> [`<Autocomplete.Input>`, `<Autocomplete.Overlay>` -> [`<Autocomplete.Menu>`]].
 *
 * - `children` is the synthetic content channel (`ChildList`) holding the Input and the Overlay —
 *   optional, faithful to Primer's optional `children`.
 *
 * Dropped: `id` — collides with the A2UI component-envelope `id` every instance already carries
 * (the `ActionList.Item` precedent).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const AutocompleteApi = {
  name: 'Autocomplete',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type AutocompleteProps = z.infer<typeof AutocompleteApi.schema>;
