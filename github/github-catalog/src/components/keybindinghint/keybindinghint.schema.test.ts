import {describe, it, expect} from 'vitest';
import {KeybindingHintApi} from './keybindinghint.schema';

describe('KeybindingHintApi.schema', () => {
  it('accepts a minimal valid KeybindingHint (keys only)', () => {
    expect(KeybindingHintApi.schema.safeParse({keys: 'Mod+k'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = KeybindingHintApi.schema.safeParse({
      keys: 'Mod+Shift+k',
      format: 'full',
      variant: 'onEmphasis',
      size: 'small',
    });
    expect(result.success).toBe(true);
  });

  it('requires keys', () => {
    expect(KeybindingHintApi.schema.safeParse({format: 'full'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(KeybindingHintApi.schema.safeParse({keys: 'Mod+k', className: 'x'}).success).toBe(false);
  });

  it('rejects out-of-enum format values', () => {
    expect(KeybindingHintApi.schema.safeParse({keys: 'Mod+k', format: 'compact'}).success).toBe(
      false,
    );
  });

  it('rejects out-of-enum variant values', () => {
    expect(KeybindingHintApi.schema.safeParse({keys: 'Mod+k', variant: 'muted'}).success).toBe(
      false,
    );
  });

  it('rejects out-of-enum size values', () => {
    expect(KeybindingHintApi.schema.safeParse({keys: 'Mod+k', size: 'large'}).success).toBe(false);
  });

  it('accepts a data-binding for keys (DynamicString)', () => {
    expect(KeybindingHintApi.schema.safeParse({keys: {path: '/keys'}}).success).toBe(true);
  });
});
