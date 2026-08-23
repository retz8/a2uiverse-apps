import {describe, it, expect} from 'vitest';
import {HeadingApi} from './heading.schema';

describe('HeadingApi.schema', () => {
  it('accepts a minimal valid Heading (text only)', () => {
    expect(HeadingApi.schema.safeParse({text: 'hi'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = HeadingApi.schema.safeParse({
      text: 'hi',
      as: 'h1',
      variant: 'large',
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(HeadingApi.schema.safeParse({as: 'h1'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(HeadingApi.schema.safeParse({text: 'hi', color: 'red'}).success).toBe(false);
  });

  it('rejects out-of-enum as values', () => {
    expect(HeadingApi.schema.safeParse({text: 'hi', as: 'h7'}).success).toBe(false);
  });

  it('rejects out-of-enum variant values', () => {
    expect(HeadingApi.schema.safeParse({text: 'hi', variant: 'huge'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(HeadingApi.schema.safeParse({text: {path: '/title'}}).success).toBe(true);
  });
});
