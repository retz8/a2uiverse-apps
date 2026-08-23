import {describe, it, expect} from 'vitest';
import {NavListLeadingVisualApi} from './navlist-leadingvisual.schema';

describe('NavListLeadingVisualApi.schema', () => {
  it('accepts a minimal valid NavList.LeadingVisual (no required props)', () => {
    expect(NavListLeadingVisualApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a static ChildList referencing an icon', () => {
    expect(NavListLeadingVisualApi.schema.safeParse({children: ['home-icon']}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListLeadingVisualApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });
});
