import {describe, it, expect} from 'vitest';
import {SplitPageLayoutHeaderApi} from './split-page-layout-header.schema';

describe('SplitPageLayoutHeaderApi.schema', () => {
  it('accepts a minimal valid Header (no props — all optional)', () => {
    expect(SplitPageLayoutHeaderApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      SplitPageLayoutHeaderApi.schema.safeParse({
        children: ['a', 'b'],
        padding: 'condensed',
        divider: 'line',
        hidden: false,
        accessibility: {label: 'Page header'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive divider with a narrow-only "filled" arm', () => {
    expect(
      SplitPageLayoutHeaderApi.schema.safeParse({
        divider: {narrow: 'filled', regular: 'line'},
      }).success,
    ).toBe(true);
  });

  it('rejects "filled" on the scalar divider arm (narrow-only)', () => {
    expect(SplitPageLayoutHeaderApi.schema.safeParse({divider: 'filled'}).success).toBe(false);
  });

  it('accepts a responsive hidden map', () => {
    expect(SplitPageLayoutHeaderApi.schema.safeParse({hidden: {narrow: true}}).success).toBe(true);
  });

  it('rejects an out-of-enum padding', () => {
    expect(SplitPageLayoutHeaderApi.schema.safeParse({padding: 'spacious'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(SplitPageLayoutHeaderApi.schema.safeParse({width: 'large'}).success).toBe(false);
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      SplitPageLayoutHeaderApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });
});
