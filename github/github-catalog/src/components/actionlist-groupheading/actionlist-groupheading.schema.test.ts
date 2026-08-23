import {describe, it, expect} from 'vitest';
import {ActionListGroupHeadingApi} from './actionlist-groupheading.schema';

describe('ActionListGroupHeadingApi.schema', () => {
  it('accepts a minimal valid GroupHeading (every prop optional)', () => {
    expect(ActionListGroupHeadingApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      ActionListGroupHeadingApi.schema.safeParse({
        children: ['label', 'trailing'],
        variant: 'filled',
        auxiliaryText: 'opened by octocat',
        visuallyHidden: true,
        as: 'h2',
      }).success,
    ).toBe(true);
  });

  it('accepts a data-binding for auxiliaryText (DynamicString)', () => {
    expect(
      ActionListGroupHeadingApi.schema.safeParse({auxiliaryText: {path: '/text'}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListGroupHeadingApi.schema.safeParse({headingWrapElement: 'li'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum variant', () => {
    expect(ActionListGroupHeadingApi.schema.safeParse({variant: 'outline'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(ActionListGroupHeadingApi.schema.safeParse({as: 'h7'}).success).toBe(false);
  });
});
