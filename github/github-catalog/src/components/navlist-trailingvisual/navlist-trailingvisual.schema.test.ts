import {describe, it, expect} from 'vitest';
import {NavListTrailingVisualApi} from './navlist-trailingvisual.schema';

describe('NavListTrailingVisualApi.schema', () => {
  it('accepts a minimal valid NavList.TrailingVisual (no required props)', () => {
    expect(NavListTrailingVisualApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList referencing a counter', () => {
    expect(NavListTrailingVisualApi.schema.safeParse({children: ['count']}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListTrailingVisualApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });
});
