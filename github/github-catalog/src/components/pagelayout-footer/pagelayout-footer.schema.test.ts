import {describe, it, expect} from 'vitest';
import {PageLayoutFooterApi} from './pagelayout-footer.schema';

describe('PageLayoutFooterApi.schema', () => {
  it('accepts an empty footer (all props optional)', () => {
    expect(PageLayoutFooterApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      PageLayoutFooterApi.schema.safeParse({
        children: ['a'],
        padding: 'condensed',
        divider: 'line',
        hidden: false,
        accessibility: {label: 'Site footer'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive divider with a filled narrow arm', () => {
    expect(
      PageLayoutFooterApi.schema.safeParse({divider: {narrow: 'filled', regular: 'line'}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageLayoutFooterApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum padding', () => {
    expect(PageLayoutFooterApi.schema.safeParse({padding: 'spacious'}).success).toBe(false);
  });
});
