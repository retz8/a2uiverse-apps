import {describe, it, expect} from 'vitest';
import {PageLayoutSidebarApi} from './pagelayout-sidebar.schema';

describe('PageLayoutSidebarApi.schema', () => {
  it('accepts an empty sidebar (all props optional)', () => {
    expect(PageLayoutSidebarApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      PageLayoutSidebarApi.schema.safeParse({
        children: ['a'],
        position: 'end',
        width: 'large',
        minWidth: 300,
        padding: 'normal',
        divider: 'line',
        sticky: true,
        responsiveVariant: 'fullscreen',
        hidden: false,
        resizable: true,
        currentWidth: 280,
        widthStorageKey: 'sidebarWidth',
        accessibility: {label: 'Navigation'},
      }).success,
    ).toBe(true);
  });

  it('accepts a custom width object', () => {
    expect(
      PageLayoutSidebarApi.schema.safeParse({
        width: {min: '200px', default: '280px', max: '360px'},
      }).success,
    ).toBe(true);
  });

  it('accepts a data-binding for currentWidth (DynamicNumber)', () => {
    expect(
      PageLayoutSidebarApi.schema.safeParse({currentWidth: {path: '/sidebarWidth'}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageLayoutSidebarApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects a non-responsive position given a responsive map', () => {
    expect(
      PageLayoutSidebarApi.schema.safeParse({position: {narrow: 'end', regular: 'start'}}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum divider', () => {
    expect(PageLayoutSidebarApi.schema.safeParse({divider: 'filled'}).success).toBe(false);
  });

  it('rejects an out-of-enum responsiveVariant', () => {
    expect(PageLayoutSidebarApi.schema.safeParse({responsiveVariant: 'overlay'}).success).toBe(
      false,
    );
  });
});
