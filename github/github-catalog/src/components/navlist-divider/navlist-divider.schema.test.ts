import {describe, it, expect} from 'vitest';
import {NavListDividerApi} from './navlist-divider.schema';

describe('NavListDividerApi.schema', () => {
  it('accepts the empty object (propless leaf)', () => {
    expect(NavListDividerApi.schema.safeParse({}).success).toBe(true);
  });

  it('rejects any prop (strict, propless)', () => {
    expect(NavListDividerApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });
});
