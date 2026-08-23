import {describe, it, expect} from 'vitest';
import {SplitPageLayoutSidebarApi} from './split-page-layout-sidebar.schema';

describe('SplitPageLayoutSidebarApi.schema', () => {
  it('accepts a minimal valid Sidebar (no props — all optional)', () => {
    expect(SplitPageLayoutSidebarApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface with a named width', () => {
    expect(
      SplitPageLayoutSidebarApi.schema.safeParse({
        children: ['a'],
        position: 'end',
        width: 'large',
        minWidth: 256,
        resizable: true,
        currentWidth: 300,
        padding: 'condensed',
        divider: 'line',
        sticky: true,
        responsiveVariant: 'fullscreen',
        hidden: false,
        accessibility: {label: 'Navigation sidebar'},
      }).success,
    ).toBe(true);
  });

  it('accepts a custom min/default/max width object', () => {
    expect(
      SplitPageLayoutSidebarApi.schema.safeParse({
        width: {min: '160px', default: '240px', max: '320px'},
      }).success,
    ).toBe(true);
  });

  it('rejects a responsive position (Sidebar position is scalar)', () => {
    expect(SplitPageLayoutSidebarApi.schema.safeParse({position: {narrow: 'end'}}).success).toBe(
      false,
    );
  });

  it('rejects a "filled" divider (Sidebar divider is scalar none/line)', () => {
    expect(SplitPageLayoutSidebarApi.schema.safeParse({divider: 'filled'}).success).toBe(false);
  });

  it('rejects an out-of-enum responsiveVariant', () => {
    expect(SplitPageLayoutSidebarApi.schema.safeParse({responsiveVariant: 'overlay'}).success).toBe(
      false,
    );
  });

  it('accepts a data-binding for currentWidth (DynamicNumber)', () => {
    expect(
      SplitPageLayoutSidebarApi.schema.safeParse({currentWidth: {path: '/sidebarWidth'}}).success,
    ).toBe(true);
  });

  it('accepts a responsive hidden map', () => {
    expect(SplitPageLayoutSidebarApi.schema.safeParse({hidden: {narrow: true}}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(SplitPageLayoutSidebarApi.schema.safeParse({offsetHeader: 64}).success).toBe(false);
  });
});
