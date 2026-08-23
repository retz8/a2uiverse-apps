import {describe, it, expect} from 'vitest';
import {PageLayoutHeaderApi} from './pagelayout-header.schema';

describe('PageLayoutHeaderApi.schema', () => {
  it('accepts an empty header (all props optional)', () => {
    expect(PageLayoutHeaderApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      PageLayoutHeaderApi.schema.safeParse({
        children: ['a', 'b'],
        padding: 'normal',
        divider: 'line',
        hidden: false,
        accessibility: {label: 'Site header'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive divider with a filled narrow arm', () => {
    expect(
      PageLayoutHeaderApi.schema.safeParse({
        divider: {narrow: 'filled', regular: 'line', wide: 'none'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive hidden map', () => {
    expect(
      PageLayoutHeaderApi.schema.safeParse({hidden: {narrow: true, regular: false}}).success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageLayoutHeaderApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageLayoutHeaderApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum padding', () => {
    expect(PageLayoutHeaderApi.schema.safeParse({padding: 'spacious'}).success).toBe(false);
  });

  it('rejects a regular divider with the narrow-only filled value', () => {
    expect(PageLayoutHeaderApi.schema.safeParse({divider: 'filled'}).success).toBe(false);
  });
});
