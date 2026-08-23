import {describe, it, expect} from 'vitest';
import {PopoverApi} from './popover.schema';

describe('PopoverApi.schema', () => {
  it('accepts a minimal valid Popover (children only)', () => {
    expect(PopoverApi.schema.safeParse({children: ['popover-content']}).success).toBe(true);
  });

  it('accepts a full-surface Popover', () => {
    expect(
      PopoverApi.schema.safeParse({
        children: ['popover-content'],
        caret: 'bottom-left',
        open: true,
        relative: true,
        as: 'section',
      }).success,
    ).toBe(true);
  });

  it('accepts a bound open path (two-way controlled visibility)', () => {
    expect(
      PopoverApi.schema.safeParse({children: ['popover-content'], open: {path: '/popoverOpen'}})
        .success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(PopoverApi.schema.safeParse({open: true}).success).toBe(false);
  });

  it('rejects an out-of-enum caret', () => {
    expect(
      PopoverApi.schema.safeParse({children: ['popover-content'], caret: 'middle'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(PopoverApi.schema.safeParse({children: ['popover-content'], as: 'span'}).success).toBe(
      false,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(PopoverApi.schema.safeParse({children: ['popover-content'], color: 'red'}).success).toBe(
      false,
    );
  });
});
