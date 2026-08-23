import {describe, it, expect} from 'vitest';
import {RadioApi} from './radio.schema';

const action = {event: {name: 'select'}};

describe('RadioApi.schema', () => {
  it('accepts a minimal valid Radio (value only)', () => {
    expect(RadioApi.schema.safeParse({value: 'option-1'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = RadioApi.schema.safeParse({
      value: 'option-1',
      name: 'radio-demo',
      checked: true,
      disabled: false,
      required: true,
      action,
      accessibility: {label: 'First option', description: 'Selects the first option'},
    });
    expect(result.success).toBe(true);
  });

  it('accepts an event action', () => {
    expect(RadioApi.schema.safeParse({value: 'o', action: {event: {name: 'select'}}}).success).toBe(
      true,
    );
  });

  it('accepts a functionCall action', () => {
    expect(
      RadioApi.schema.safeParse({
        value: 'o',
        action: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
      }).success,
    ).toBe(true);
  });

  it('requires value', () => {
    expect(RadioApi.schema.safeParse({name: 'radio-demo'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(RadioApi.schema.safeParse({value: 'o', color: 'red'}).success).toBe(false);
  });

  it('accepts a data-binding for checked (DynamicBoolean)', () => {
    expect(RadioApi.schema.safeParse({value: 'o', checked: {path: '/selected'}}).success).toBe(
      true,
    );
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(RadioApi.schema.safeParse({value: 'o', disabled: {path: '/locked'}}).success).toBe(true);
  });

  it('accepts accessibility label and description', () => {
    expect(
      RadioApi.schema.safeParse({value: 'o', accessibility: {label: 'First option'}}).success,
    ).toBe(true);
  });
});
