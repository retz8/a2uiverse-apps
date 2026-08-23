import {describe, it, expect} from 'vitest';
import {PopoverContentApi} from './popover-content.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'popover-dismiss', context: {}}};

describe('PopoverContentApi.schema', () => {
  it('accepts a minimal valid Popover.Content (children only)', () => {
    expect(PopoverContentApi.schema.safeParse({children: ['popover-heading']}).success).toBe(true);
  });

  it('accepts a full-surface Popover.Content', () => {
    expect(
      PopoverContentApi.schema.safeParse({
        children: ['popover-heading', 'popover-message', 'popover-action'],
        width: 'medium',
        height: 'large',
        overflow: 'scroll',
        onClickOutside: eventAction,
        accessibility: {label: 'Notice', description: 'Click outside to dismiss'},
      }).success,
    ).toBe(true);
  });

  it('accepts a functionCall onClickOutside', () => {
    expect(
      PopoverContentApi.schema.safeParse({children: ['popover-heading'], onClickOutside: fnAction})
        .success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(PopoverContentApi.schema.safeParse({width: 'small'}).success).toBe(false);
  });

  it('rejects an out-of-enum width', () => {
    expect(
      PopoverContentApi.schema.safeParse({children: ['popover-heading'], width: 'huge'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum height', () => {
    expect(
      PopoverContentApi.schema.safeParse({children: ['popover-heading'], height: 'tiny'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum overflow', () => {
    expect(
      PopoverContentApi.schema.safeParse({children: ['popover-heading'], overflow: 'clip'}).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      PopoverContentApi.schema.safeParse({children: ['popover-heading'], color: 'red'}).success,
    ).toBe(false);
  });
});
