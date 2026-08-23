import {describe, it, expect} from 'vitest';
import {NavListGroupApi} from './navlist-group.schema';

describe('NavListGroupApi.schema', () => {
  it('accepts a minimal valid NavList.Group (no required props)', () => {
    expect(NavListGroupApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      NavListGroupApi.schema.safeParse({children: ['docs', 'community'], title: 'Support'}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListGroupApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });

  it('accepts a data-binding for title (DynamicString)', () => {
    expect(NavListGroupApi.schema.safeParse({title: {path: '/section'}}).success).toBe(true);
  });
});
