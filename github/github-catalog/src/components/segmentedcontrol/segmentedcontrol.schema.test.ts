import {describe, it, expect} from 'vitest';
import {SegmentedControlApi} from './segmentedcontrol.schema';

describe('SegmentedControlApi.schema', () => {
  it('accepts a minimal valid SegmentedControl (every prop optional)', () => {
    expect(SegmentedControlApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface SegmentedControl', () => {
    expect(
      SegmentedControlApi.schema.safeParse({
        children: ['s0', 's1', 's2'],
        selectedIndex: 1,
        action: {functionCall: {call: 'consoleLog', args: {message: 'changed'}}},
        fullWidth: true,
        size: 'small',
        variant: {narrow: 'hideLabels', regular: 'default'},
        accessibility: {label: 'File view'},
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList of segments', () => {
    expect(SegmentedControlApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      SegmentedControlApi.schema.safeParse({children: {componentId: 'tpl', path: '/tabs'}}).success,
    ).toBe(true);
  });

  it('accepts an event action carrying a bound context', () => {
    expect(
      SegmentedControlApi.schema.safeParse({
        action: {event: {name: 'change', context: {selectedIndex: {path: '/view'}}}},
      }).success,
    ).toBe(true);
  });

  it('accepts a data-binding for selectedIndex (DynamicNumber)', () => {
    expect(SegmentedControlApi.schema.safeParse({selectedIndex: {path: '/view'}}).success).toBe(
      true,
    );
  });

  it('accepts the literal-only default variant scalar arm', () => {
    expect(SegmentedControlApi.schema.safeParse({variant: 'default'}).success).toBe(true);
  });

  it('accepts a responsive object for fullWidth', () => {
    expect(
      SegmentedControlApi.schema.safeParse({fullWidth: {narrow: true, regular: false}}).success,
    ).toBe(true);
  });

  it('rejects a non-default scalar variant (hideLabels/dropdown are per-viewport only)', () => {
    expect(SegmentedControlApi.schema.safeParse({variant: 'hideLabels'}).success).toBe(false);
  });

  it('rejects an out-of-enum variant mode in the responsive object', () => {
    expect(SegmentedControlApi.schema.safeParse({variant: {narrow: 'collapse'}}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum size', () => {
    expect(SegmentedControlApi.schema.safeParse({size: 'large'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(SegmentedControlApi.schema.safeParse({onChange: 'x'}).success).toBe(false);
  });
});
