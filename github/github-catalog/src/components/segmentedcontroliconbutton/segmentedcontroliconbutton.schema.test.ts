import {describe, it, expect} from 'vitest';
import {SegmentedControlIconButtonApi} from './segmentedcontroliconbutton.schema';

describe('SegmentedControlIconButtonApi.schema', () => {
  it('accepts a minimal valid icon segment (icon + accessibility)', () => {
    expect(
      SegmentedControlIconButtonApi.schema.safeParse({
        icon: 'glyph',
        accessibility: {label: 'Zoom'},
      }).success,
    ).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      SegmentedControlIconButtonApi.schema.safeParse({
        icon: 'glyph',
        accessibility: {label: 'Zoom'},
        description: 'Zoom into the diff',
        tooltipDirection: 'n',
        disabled: true,
      }).success,
    ).toBe(true);
  });

  it('accepts a path-bound description (DynamicString)', () => {
    expect(
      SegmentedControlIconButtonApi.schema.safeParse({
        icon: 'glyph',
        accessibility: {label: 'Zoom'},
        description: {path: '/tip'},
      }).success,
    ).toBe(true);
  });

  it('accepts a path-bound disabled (DynamicBoolean)', () => {
    expect(
      SegmentedControlIconButtonApi.schema.safeParse({
        icon: 'glyph',
        accessibility: {label: 'Zoom'},
        disabled: {path: '/locked'},
      }).success,
    ).toBe(true);
  });

  it('requires icon', () => {
    expect(
      SegmentedControlIconButtonApi.schema.safeParse({accessibility: {label: 'Zoom'}}).success,
    ).toBe(false);
  });

  it('requires accessibility', () => {
    expect(SegmentedControlIconButtonApi.schema.safeParse({icon: 'glyph'}).success).toBe(false);
  });

  it('rejects an out-of-enum tooltipDirection', () => {
    expect(
      SegmentedControlIconButtonApi.schema.safeParse({
        icon: 'glyph',
        accessibility: {label: 'Zoom'},
        tooltipDirection: 'north',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      SegmentedControlIconButtonApi.schema.safeParse({
        icon: 'glyph',
        accessibility: {label: 'Zoom'},
        selected: true,
      }).success,
    ).toBe(false);
  });
});
