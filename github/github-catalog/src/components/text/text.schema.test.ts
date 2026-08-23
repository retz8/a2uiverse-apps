import {describe, it, expect} from 'vitest';
import {TextApi} from './text.schema';

describe('TextApi.schema', () => {
  it('accepts a minimal valid Text (text only)', () => {
    expect(TextApi.schema.safeParse({text: 'hi'}).success).toBe(true);
  });

  it('accepts all four styling props', () => {
    const result = TextApi.schema.safeParse({
      text: 'hi',
      as: 'p',
      size: 'large',
      weight: 'semibold',
      whiteSpace: 'nowrap',
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(TextApi.schema.safeParse({size: 'large'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TextApi.schema.safeParse({text: 'hi', color: 'red'}).success).toBe(false);
  });

  it('rejects out-of-enum values', () => {
    expect(TextApi.schema.safeParse({text: 'hi', size: 'huge'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(TextApi.schema.safeParse({text: {path: '/title'}}).success).toBe(true);
  });
});
