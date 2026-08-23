import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer KeybindingHint, props-only.
 *
 * - `keys` is the content channel (Primer KeybindingHint takes no children — the keys to
 *   display arrive through the `keys` prop), typed DynamicString so it stays bindable.
 * - `format`/`variant`/`size` are the carried display enums; their defaults surface only
 *   in `catalog.json`, never as zod `.default(...)`.
 * - `.strict()` forbids any prop outside this surface (`className` is dropped).
 */
export const KeybindingHintApi = {
  name: 'KeybindingHint',
  schema: z
    .object({
      keys: CommonSchemas.DynamicString,
      format: z.enum(['condensed', 'full']).optional(),
      variant: z.enum(['normal', 'onEmphasis', 'onPrimary']).optional(),
      size: z.enum(['small', 'normal']).optional(),
    })
    .strict(),
} as const;

export type KeybindingHintProps = z.infer<typeof KeybindingHintApi.schema>;
