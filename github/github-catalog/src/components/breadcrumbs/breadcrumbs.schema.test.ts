import {describe, it, expect} from 'vitest';
import {BreadcrumbsApi} from './breadcrumbs.schema';

describe('BreadcrumbsApi.schema', () => {
  it('accepts a minimal valid Breadcrumbs (every prop optional)', () => {
    expect(BreadcrumbsApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface Breadcrumbs', () => {
    expect(
      BreadcrumbsApi.schema.safeParse({
        children: ['c1', 'c2', 'c3'],
        overflow: 'menu',
        variant: 'spacious',
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(BreadcrumbsApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      BreadcrumbsApi.schema.safeParse({children: {componentId: 'crumb', path: '/trail'}}).success,
    ).toBe(true);
  });

  it('accepts each overflow value', () => {
    for (const overflow of ['wrap', 'menu', 'menu-with-root']) {
      expect(BreadcrumbsApi.schema.safeParse({overflow}).success).toBe(true);
    }
  });

  it('rejects unknown props (strict)', () => {
    expect(BreadcrumbsApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum overflow', () => {
    expect(BreadcrumbsApi.schema.safeParse({overflow: 'scroll'}).success).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(BreadcrumbsApi.schema.safeParse({variant: 'compact'}).success).toBe(false);
  });
});
