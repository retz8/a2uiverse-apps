import {describe, it, expect} from 'vitest';
import {PageLayoutApi} from './pagelayout.schema';

describe('PageLayoutApi.schema', () => {
  it('accepts an empty PageLayout (all props optional)', () => {
    expect(PageLayoutApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      PageLayoutApi.schema.safeParse({
        header: 'h',
        content: 'c',
        pane: 'p',
        sidebar: 's',
        footer: 'f',
        containerWidth: 'xlarge',
        padding: 'normal',
        rowGap: 'condensed',
        columnGap: 'none',
      }).success,
    ).toBe(true);
  });

  it('accepts a subset of region slots', () => {
    expect(PageLayoutApi.schema.safeParse({header: 'h', content: 'c'}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageLayoutApi.schema.safeParse({header: 'h', color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum containerWidth', () => {
    expect(PageLayoutApi.schema.safeParse({containerWidth: 'huge'}).success).toBe(false);
  });

  it('rejects an out-of-enum padding', () => {
    expect(PageLayoutApi.schema.safeParse({padding: 'spacious'}).success).toBe(false);
  });
});
