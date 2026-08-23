import {describe, it, expect} from 'vitest';
import {ActionMenuOverlayApi} from './actionmenu-overlay.schema';

describe('ActionMenuOverlayApi.schema', () => {
  it('accepts a minimal valid ActionMenu.Overlay (children only)', () => {
    expect(ActionMenuOverlayApi.schema.safeParse({children: ['list']}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({
        children: ['list'],
        align: 'center',
        side: 'outside-top',
        variant: 'fullscreen',
        displayInViewport: true,
        width: 'large',
        height: 'medium',
        maxHeight: 'small',
        maxWidth: 'xlarge',
      }).success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(ActionMenuOverlayApi.schema.safeParse({side: 'outside-top'}).success).toBe(false);
  });

  it('rejects an out-of-enum side', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({children: ['list'], side: 'nowhere'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum align', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({children: ['list'], align: 'middle'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum width', () => {
    expect(ActionMenuOverlayApi.schema.safeParse({children: ['list'], width: 'tiny'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum height', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({children: ['list'], height: 'huge'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum maxHeight', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({children: ['list'], maxHeight: 'auto'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum maxWidth', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({children: ['list'], maxWidth: 'auto'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({children: ['list'], variant: 'sidebar'}).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict; onPositionChange and the passthrough bag are dropped)', () => {
    expect(
      ActionMenuOverlayApi.schema.safeParse({children: ['list'], onPositionChange: {}}).success,
    ).toBe(false);
  });
});
