import {describe, it, expect} from 'vitest';
import {LabelApi} from './label.schema';

describe('LabelApi.schema', () => {
  it('accepts a minimal valid Label (text only)', () => {
    expect(LabelApi.schema.safeParse({text: 'hi'}).success).toBe(true);
  });

  it('accepts the full styling surface', () => {
    const result = LabelApi.schema.safeParse({
      text: 'hi',
      variant: 'success',
      size: 'large',
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(LabelApi.schema.safeParse({variant: 'primary'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(LabelApi.schema.safeParse({text: 'hi', color: 'red'}).success).toBe(false);
  });

  it('rejects out-of-enum variant values', () => {
    expect(LabelApi.schema.safeParse({text: 'hi', variant: 'info'}).success).toBe(false);
  });

  it('rejects out-of-enum size values', () => {
    expect(LabelApi.schema.safeParse({text: 'hi', size: 'medium'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(LabelApi.schema.safeParse({text: {path: '/status'}}).success).toBe(true);
  });
});
