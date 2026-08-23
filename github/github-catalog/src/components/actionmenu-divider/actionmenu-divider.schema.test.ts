import {describe, it, expect} from 'vitest';
import {ActionMenuDividerApi} from './actionmenu-divider.schema';

describe('ActionMenuDividerApi.schema', () => {
  it('accepts an empty Divider (no props)', () => {
    expect(ActionMenuDividerApi.schema.safeParse({}).success).toBe(true);
  });

  it('rejects any prop (strict; the separator carries none)', () => {
    expect(ActionMenuDividerApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });
});
