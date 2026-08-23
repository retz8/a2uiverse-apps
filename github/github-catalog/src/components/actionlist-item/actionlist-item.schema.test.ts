import {describe, it, expect} from 'vitest';
import {ActionListItemApi} from './actionlist-item.schema';

const action = {event: {name: 'select'}};

describe('ActionListItemApi.schema', () => {
  it('accepts a minimal valid Item (every prop optional)', () => {
    expect(ActionListItemApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      ActionListItemApi.schema.safeParse({
        children: ['label', 'lv', 'desc'],
        selected: true,
        action,
        active: false,
        variant: 'danger',
        size: 'large',
        disabled: false,
        loading: false,
        inactiveText: 'Unavailable',
        role: 'option',
      }).success,
    ).toBe(true);
  });

  it('accepts an event action', () => {
    expect(ActionListItemApi.schema.safeParse({action: {event: {name: 'select'}}}).success).toBe(
      true,
    );
  });

  it('accepts a functionCall action', () => {
    expect(
      ActionListItemApi.schema.safeParse({
        action: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
      }).success,
    ).toBe(true);
  });

  it('accepts a data-binding for selected (DynamicBoolean)', () => {
    expect(ActionListItemApi.schema.safeParse({selected: {path: '/assigned'}}).success).toBe(true);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(ActionListItemApi.schema.safeParse({disabled: {path: '/removed'}}).success).toBe(true);
  });

  it('accepts a data-binding for inactiveText (DynamicString)', () => {
    expect(ActionListItemApi.schema.safeParse({inactiveText: {path: '/reason'}}).success).toBe(
      true,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(ActionListItemApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an `id` prop (subsumed by the A2UI component-envelope id)', () => {
    expect(ActionListItemApi.schema.safeParse({id: 'row-1'}).success).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(ActionListItemApi.schema.safeParse({variant: 'primary'}).success).toBe(false);
  });

  it('rejects an out-of-enum size', () => {
    expect(ActionListItemApi.schema.safeParse({size: 'small'}).success).toBe(false);
  });
});
