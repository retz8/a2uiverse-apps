import {describe, it, expect} from 'vitest';
import {NavListDescriptionApi} from './navlist-description.schema';

describe('NavListDescriptionApi.schema', () => {
  it('accepts a minimal valid Description (text only)', () => {
    expect(NavListDescriptionApi.schema.safeParse({text: 'Open and merged'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      NavListDescriptionApi.schema.safeParse({
        text: 'A long description',
        variant: 'block',
        truncate: true,
      }).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(NavListDescriptionApi.schema.safeParse({variant: 'inline'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListDescriptionApi.schema.safeParse({text: 'x', className: 'y'}).success).toBe(false);
  });

  it('rejects out-of-enum variant', () => {
    expect(NavListDescriptionApi.schema.safeParse({text: 'x', variant: 'floating'}).success).toBe(
      false,
    );
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(NavListDescriptionApi.schema.safeParse({text: {path: '/desc'}}).success).toBe(true);
  });
});
