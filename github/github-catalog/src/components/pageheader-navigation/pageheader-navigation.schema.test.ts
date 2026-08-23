import {describe, it, expect} from 'vitest';
import {PageHeaderNavigationApi} from './pageheader-navigation.schema';

describe('PageHeaderNavigationApi.schema', () => {
  it('accepts a minimal valid Navigation (every prop optional)', () => {
    expect(PageHeaderNavigationApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface Navigation', () => {
    expect(
      PageHeaderNavigationApi.schema.safeParse({
        children: ['a'],
        as: 'nav',
        'aria-label': 'Tabs',
        'aria-labelledby': 'nav-title',
        hidden: false,
      }).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderNavigationApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('rejects an out-of-enum as', () => {
    expect(PageHeaderNavigationApi.schema.safeParse({as: 'ul'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderNavigationApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('accepts a data-binding for aria-label (DynamicString)', () => {
    expect(PageHeaderNavigationApi.schema.safeParse({'aria-label': {path: '/label'}}).success).toBe(
      true,
    );
  });
});
