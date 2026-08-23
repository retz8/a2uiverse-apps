import {describe, it, expect} from 'vitest';
import {AnchoredOverlayApi} from './anchoredoverlay.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'panel-open', context: {}}};

describe('AnchoredOverlayApi.schema', () => {
  it('accepts a minimal valid AnchoredOverlay (anchor + open)', () => {
    expect(AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: true}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({
        anchor: 'trigger',
        open: {path: '/open'},
        onOpen: eventAction,
        onClose: fnAction,
        children: ['panel-content'],
        side: 'outside-top',
        align: 'center',
        anchorOffset: 24,
        alignmentOffset: 24,
        displayInViewport: true,
        height: 'medium',
        width: 'large',
        preventOverflow: false,
        pinPosition: true,
        variant: 'fullscreen',
        displayCloseButton: false,
      }).success,
    ).toBe(true);
  });

  it('accepts a bound open path (two-way controlled visibility)', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: {path: '/open'}}).success,
    ).toBe(true);
  });

  it('accepts both onOpen/onClose action shapes (functionCall and event)', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({
        anchor: 'trigger',
        open: true,
        onOpen: fnAction,
        onClose: eventAction,
      }).success,
    ).toBe(true);
  });

  it('rejects a missing required anchor', () => {
    expect(AnchoredOverlayApi.schema.safeParse({open: true}).success).toBe(false);
  });

  it('rejects a missing required open', () => {
    expect(AnchoredOverlayApi.schema.safeParse({anchor: 'trigger'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: true, color: 'red'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum side', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: true, side: 'nowhere'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum align', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: true, align: 'middle'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum height', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: true, height: 'huge'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum width', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: true, width: 'tiny'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(
      AnchoredOverlayApi.schema.safeParse({anchor: 'trigger', open: true, variant: 'sidebar'})
        .success,
    ).toBe(false);
  });
});
