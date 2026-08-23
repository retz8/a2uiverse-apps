import {describe, it, expect} from 'vitest';
import {ActionMenuApi} from './actionmenu.schema';

describe('ActionMenuApi.schema', () => {
  it('accepts a minimal valid ActionMenu (children only)', () => {
    expect(ActionMenuApi.schema.safeParse({children: ['trigger', 'overlay']}).success).toBe(true);
  });

  it('accepts the full carried surface (children + literal open)', () => {
    expect(
      ActionMenuApi.schema.safeParse({children: ['trigger', 'overlay'], open: true}).success,
    ).toBe(true);
  });

  it('accepts a bound open path (two-way controlled visibility)', () => {
    expect(
      ActionMenuApi.schema.safeParse({children: ['trigger', 'overlay'], open: {path: '/open'}})
        .success,
    ).toBe(true);
  });

  it('accepts omitting open (Primer runs uncontrolled)', () => {
    expect(ActionMenuApi.schema.safeParse({children: ['trigger']}).success).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(ActionMenuApi.schema.safeParse({open: true}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionMenuApi.schema.safeParse({children: ['trigger'], anchorRef: 'x'}).success).toBe(
      false,
    );
  });
});
