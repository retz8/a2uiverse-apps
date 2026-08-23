import {describe, it, expect} from 'vitest';
import {SegmentedControlButtonApi} from './segmentedcontrolbutton.schema';

describe('SegmentedControlButtonApi.schema', () => {
  it('accepts a minimal valid segment (label only)', () => {
    expect(SegmentedControlButtonApi.schema.safeParse({label: 'Preview'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      SegmentedControlButtonApi.schema.safeParse({
        label: 'Preview',
        leadingVisual: 'glyph',
        count: '12',
        disabled: true,
        accessibility: {label: 'Preview tab', description: 'Rendered preview'},
      }).success,
    ).toBe(true);
  });

  it('accepts a path-bound label (DynamicString)', () => {
    expect(SegmentedControlButtonApi.schema.safeParse({label: {path: '/name'}}).success).toBe(true);
  });

  it('accepts a path-bound disabled (DynamicBoolean)', () => {
    expect(
      SegmentedControlButtonApi.schema.safeParse({label: 'Raw', disabled: {path: '/locked'}})
        .success,
    ).toBe(true);
  });

  it('requires label', () => {
    expect(SegmentedControlButtonApi.schema.safeParse({leadingVisual: 'glyph'}).success).toBe(
      false,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(
      SegmentedControlButtonApi.schema.safeParse({label: 'Preview', selected: true}).success,
    ).toBe(false);
  });
});
