import {describe, it, expect} from 'vitest';
import {PageLayoutContentApi} from './pagelayout-content.schema';

describe('PageLayoutContentApi.schema', () => {
  it('accepts an empty content region (all props optional)', () => {
    expect(PageLayoutContentApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      PageLayoutContentApi.schema.safeParse({
        children: ['a', 'b'],
        as: 'section',
        width: 'large',
        padding: 'normal',
        hidden: false,
        accessibility: {label: 'Main content'},
      }).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageLayoutContentApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageLayoutContentApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(PageLayoutContentApi.schema.safeParse({as: 'aside'}).success).toBe(false);
  });

  it('rejects an out-of-enum width', () => {
    expect(PageLayoutContentApi.schema.safeParse({width: 'small'}).success).toBe(false);
  });
});
