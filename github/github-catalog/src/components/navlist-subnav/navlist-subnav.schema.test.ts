import {describe, it, expect} from 'vitest';
import {NavListSubNavApi} from './navlist-subnav.schema';

describe('NavListSubNavApi.schema', () => {
  it('accepts a minimal valid NavList.SubNav (no required props)', () => {
    expect(NavListSubNavApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList of nested item ids', () => {
    expect(NavListSubNavApi.schema.safeParse({children: ['open', 'closed']}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListSubNavApi.schema.safeParse({as: 'ul'}).success).toBe(false);
  });
});
