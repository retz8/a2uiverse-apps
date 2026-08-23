import {describe, it, expect} from 'vitest';
import {NavListApi} from './navlist.schema';

describe('NavListApi.schema', () => {
  it('accepts a minimal valid NavList (no required props)', () => {
    expect(NavListApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList of item ids', () => {
    expect(NavListApi.schema.safeParse({children: ['it1', 'it2', 'grp']}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = NavListApi.schema.safeParse({
      children: ['it1'],
      'aria-label': 'Repository',
      'aria-labelledby': 'nav-heading',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListApi.schema.safeParse({as: 'nav'}).success).toBe(false);
  });

  it('accepts a data-binding for aria-label (DynamicString)', () => {
    expect(NavListApi.schema.safeParse({'aria-label': {path: '/label'}}).success).toBe(true);
  });

  it('accepts a data-binding for aria-labelledby (DynamicString)', () => {
    expect(NavListApi.schema.safeParse({'aria-labelledby': {path: '/labelledby'}}).success).toBe(
      true,
    );
  });
});
