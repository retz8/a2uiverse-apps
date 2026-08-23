import {describe, it, expect} from 'vitest';
import {SplitPageLayoutPaneApi} from './split-page-layout-pane.schema';

describe('SplitPageLayoutPaneApi.schema', () => {
  it('accepts a minimal valid Pane (no props — all optional)', () => {
    expect(SplitPageLayoutPaneApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface with a named width', () => {
    expect(
      SplitPageLayoutPaneApi.schema.safeParse({
        children: ['a'],
        position: 'end',
        width: 'large',
        minWidth: 200,
        padding: 'condensed',
        divider: 'line',
        sticky: false,
        offsetHeader: 64,
        hidden: false,
        resizable: true,
        currentWidth: 240,
        accessibility: {label: 'Details pane'},
      }).success,
    ).toBe(true);
  });

  it('accepts a custom min/default/max width object', () => {
    expect(
      SplitPageLayoutPaneApi.schema.safeParse({
        width: {min: '160px', default: '240px', max: '320px'},
      }).success,
    ).toBe(true);
  });

  it('accepts a responsive position map', () => {
    expect(SplitPageLayoutPaneApi.schema.safeParse({position: {narrow: 'end'}}).success).toBe(true);
  });

  it('accepts a responsive divider with a narrow-only "filled" arm', () => {
    expect(SplitPageLayoutPaneApi.schema.safeParse({divider: {narrow: 'filled'}}).success).toBe(
      true,
    );
  });

  it('accepts a string offsetHeader', () => {
    expect(SplitPageLayoutPaneApi.schema.safeParse({offsetHeader: '4rem'}).success).toBe(true);
  });

  it('accepts a data-binding for currentWidth (DynamicNumber)', () => {
    expect(
      SplitPageLayoutPaneApi.schema.safeParse({currentWidth: {path: '/paneWidth'}}).success,
    ).toBe(true);
  });

  it('rejects an out-of-enum position', () => {
    expect(SplitPageLayoutPaneApi.schema.safeParse({position: 'top'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(SplitPageLayoutPaneApi.schema.safeParse({widthStorageKey: 'x'}).success).toBe(false);
  });
});
