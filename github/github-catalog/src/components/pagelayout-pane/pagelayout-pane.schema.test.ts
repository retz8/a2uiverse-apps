import {describe, it, expect} from 'vitest';
import {PageLayoutPaneApi} from './pagelayout-pane.schema';

describe('PageLayoutPaneApi.schema', () => {
  it('accepts an empty pane (all props optional)', () => {
    expect(PageLayoutPaneApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      PageLayoutPaneApi.schema.safeParse({
        children: ['a'],
        position: 'start',
        width: 'large',
        minWidth: 300,
        padding: 'normal',
        divider: 'line',
        sticky: true,
        offsetHeader: 64,
        hidden: false,
        resizable: true,
        currentWidth: 320,
        widthStorageKey: 'paneWidth',
        accessibility: {label: 'Details pane'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive position', () => {
    expect(
      PageLayoutPaneApi.schema.safeParse({position: {narrow: 'end', regular: 'start'}}).success,
    ).toBe(true);
  });

  it('accepts a custom width object', () => {
    expect(
      PageLayoutPaneApi.schema.safeParse({
        width: {min: '200px', default: '300px', max: '400px'},
      }).success,
    ).toBe(true);
  });

  it('accepts a string offsetHeader (CSS length)', () => {
    expect(PageLayoutPaneApi.schema.safeParse({offsetHeader: '4rem'}).success).toBe(true);
  });

  it('accepts a data-binding for currentWidth (DynamicNumber)', () => {
    expect(PageLayoutPaneApi.schema.safeParse({currentWidth: {path: '/paneWidth'}}).success).toBe(
      true,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(PageLayoutPaneApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum padding', () => {
    expect(PageLayoutPaneApi.schema.safeParse({padding: 'spacious'}).success).toBe(false);
  });
});
