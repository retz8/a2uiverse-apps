import {describe, it, expect} from 'vitest';
import {ActionListLinkItemApi} from './actionlist-linkitem.schema';

describe('ActionListLinkItemApi.schema', () => {
  it('accepts a minimal valid LinkItem (href only)', () => {
    expect(ActionListLinkItemApi.schema.safeParse({href: 'https://github.com'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      ActionListLinkItemApi.schema.safeParse({
        children: ['label', 'lv'],
        href: 'https://github.com/octocat/repo',
        active: true,
        inactiveText: 'Unavailable',
        variant: 'danger',
        size: 'large',
        target: '_blank',
      }).success,
    ).toBe(true);
  });

  it('requires href', () => {
    expect(ActionListLinkItemApi.schema.safeParse({variant: 'default'}).success).toBe(false);
  });

  it('accepts a data-binding for href (DynamicString)', () => {
    expect(ActionListLinkItemApi.schema.safeParse({href: {path: '/url'}}).success).toBe(true);
  });

  it('accepts a data-binding for active (DynamicBoolean)', () => {
    expect(
      ActionListLinkItemApi.schema.safeParse({href: 'https://x', active: {path: '/current'}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      ActionListLinkItemApi.schema.safeParse({href: 'https://x', rel: 'noopener'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum target', () => {
    expect(
      ActionListLinkItemApi.schema.safeParse({href: 'https://x', target: '_top'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(
      ActionListLinkItemApi.schema.safeParse({href: 'https://x', variant: 'primary'}).success,
    ).toBe(false);
  });
});
