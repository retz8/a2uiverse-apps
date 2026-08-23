import {describe, it, expect} from 'vitest';
import {SplitPageLayoutFooterApi} from './split-page-layout-footer.schema';

describe('SplitPageLayoutFooterApi.schema', () => {
  it('accepts a minimal valid Footer (no props — all optional)', () => {
    expect(SplitPageLayoutFooterApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      SplitPageLayoutFooterApi.schema.safeParse({
        children: ['a'],
        padding: 'normal',
        divider: 'line',
        hidden: false,
        accessibility: {label: 'Page footer'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive divider with a narrow-only "filled" arm', () => {
    expect(SplitPageLayoutFooterApi.schema.safeParse({divider: {narrow: 'filled'}}).success).toBe(
      true,
    );
  });

  it('rejects "filled" on the scalar divider arm (narrow-only)', () => {
    expect(SplitPageLayoutFooterApi.schema.safeParse({divider: 'filled'}).success).toBe(false);
  });

  it('rejects an out-of-enum padding', () => {
    expect(SplitPageLayoutFooterApi.schema.safeParse({padding: 'cozy'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(SplitPageLayoutFooterApi.schema.safeParse({position: 'end'}).success).toBe(false);
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      SplitPageLayoutFooterApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });
});
