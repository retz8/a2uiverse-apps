import {describe, it, expect} from 'vitest';
import {ActionMenuAnchorApi} from './actionmenu-anchor.schema';

describe('ActionMenuAnchorApi.schema', () => {
  it('accepts a valid ActionMenu.Anchor (child)', () => {
    expect(ActionMenuAnchorApi.schema.safeParse({child: 'kebab'}).success).toBe(true);
  });

  it('rejects a missing required child', () => {
    expect(ActionMenuAnchorApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict; id and HTML attributes are dropped)', () => {
    expect(ActionMenuAnchorApi.schema.safeParse({child: 'kebab', id: 'x'}).success).toBe(false);
  });
});
