import {describe, it, expect} from 'vitest';
import {ActionListDividerApi} from './actionlist-divider.schema';

describe('ActionListDividerApi.schema', () => {
  it('accepts an empty Divider (no props)', () => {
    expect(ActionListDividerApi.schema.safeParse({}).success).toBe(true);
  });

  it('rejects any prop (strict; the separator carries none)', () => {
    expect(ActionListDividerApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });
});
