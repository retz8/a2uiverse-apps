import {describe, it, expect} from 'vitest';
import {NavListGroupHeadingApi} from './navlist-groupheading.schema';

describe('NavListGroupHeadingApi.schema', () => {
  it('accepts a minimal valid GroupHeading (text only)', () => {
    expect(NavListGroupHeadingApi.schema.safeParse({text: 'Support'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      NavListGroupHeadingApi.schema.safeParse({
        text: 'Support',
        variant: 'filled',
        auxiliaryText: 'Help resources',
        visuallyHidden: true,
        as: 'h3',
      }).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(NavListGroupHeadingApi.schema.safeParse({variant: 'subtle'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      NavListGroupHeadingApi.schema.safeParse({text: 'x', headingWrapElement: 'li'}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum variant', () => {
    expect(NavListGroupHeadingApi.schema.safeParse({text: 'x', variant: 'bold'}).success).toBe(
      false,
    );
  });

  it('rejects out-of-enum as', () => {
    expect(NavListGroupHeadingApi.schema.safeParse({text: 'x', as: 'h7'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(NavListGroupHeadingApi.schema.safeParse({text: {path: '/heading'}}).success).toBe(true);
  });

  it('accepts a data-binding for auxiliaryText (DynamicString)', () => {
    expect(
      NavListGroupHeadingApi.schema.safeParse({text: 'x', auxiliaryText: {path: '/aux'}}).success,
    ).toBe(true);
  });
});
