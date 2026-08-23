import {describe, it, expect} from 'vitest';
import {NavListItemApi} from './navlist-item.schema';

describe('NavListItemApi.schema', () => {
  it('accepts a minimal valid NavList.Item (no required props)', () => {
    expect(NavListItemApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = NavListItemApi.schema.safeParse({
      children: ['label', 'lv'],
      href: '#/dashboard',
      'aria-current': 'page',
      defaultOpen: true,
      inactiveText: 'Available once initialized',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListItemApi.schema.safeParse({as: 'button'}).success).toBe(false);
  });

  it('rejects out-of-enum aria-current', () => {
    expect(NavListItemApi.schema.safeParse({'aria-current': 'active'}).success).toBe(false);
  });

  it('accepts a data-binding for href (DynamicString)', () => {
    expect(NavListItemApi.schema.safeParse({href: {path: '/href'}}).success).toBe(true);
  });

  it('accepts a data-binding for inactiveText (DynamicString)', () => {
    expect(NavListItemApi.schema.safeParse({inactiveText: {path: '/why'}}).success).toBe(true);
  });
});
