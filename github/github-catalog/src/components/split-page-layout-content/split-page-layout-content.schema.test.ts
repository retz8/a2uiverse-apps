import {describe, it, expect} from 'vitest';
import {SplitPageLayoutContentApi} from './split-page-layout-content.schema';

describe('SplitPageLayoutContentApi.schema', () => {
  it('accepts a minimal valid Content (no props — all optional)', () => {
    expect(SplitPageLayoutContentApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      SplitPageLayoutContentApi.schema.safeParse({
        children: ['a', 'b'],
        as: 'section',
        width: 'xlarge',
        padding: 'condensed',
        hidden: false,
        accessibility: {label: 'Main content'},
      }).success,
    ).toBe(true);
  });

  it('rejects an out-of-enum `as`', () => {
    expect(SplitPageLayoutContentApi.schema.safeParse({as: 'span'}).success).toBe(false);
  });

  it('rejects an out-of-enum `width`', () => {
    expect(SplitPageLayoutContentApi.schema.safeParse({width: 'small'}).success).toBe(false);
  });

  it('accepts a responsive hidden map', () => {
    expect(SplitPageLayoutContentApi.schema.safeParse({hidden: {regular: true}}).success).toBe(
      true,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(SplitPageLayoutContentApi.schema.safeParse({divider: 'line'}).success).toBe(false);
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      SplitPageLayoutContentApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });
});
