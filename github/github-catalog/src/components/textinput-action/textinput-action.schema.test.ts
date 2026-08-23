import {describe, it, expect} from 'vitest';
import {TextInputActionApi} from './textinput-action.schema';

const action = {event: {name: 'clear'}};

describe('TextInputActionApi.schema', () => {
  it('accepts a minimal valid TextInput.Action (action only)', () => {
    expect(TextInputActionApi.schema.safeParse({action}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = TextInputActionApi.schema.safeParse({
      action,
      icon: 'glyph',
      disabled: true,
      tooltipDirection: 'ne',
      accessibility: {label: 'Clear', description: 'Clears the field'},
    });
    expect(result.success).toBe(true);
  });

  it('accepts an event action', () => {
    expect(TextInputActionApi.schema.safeParse({action: {event: {name: 'clear'}}}).success).toBe(
      true,
    );
  });

  it('accepts a functionCall action', () => {
    expect(
      TextInputActionApi.schema.safeParse({
        action: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
      }).success,
    ).toBe(true);
  });

  it('requires action', () => {
    expect(TextInputActionApi.schema.safeParse({icon: 'glyph'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TextInputActionApi.schema.safeParse({action, variant: 'invisible'}).success).toBe(false);
  });

  it('rejects out-of-enum tooltipDirection values', () => {
    expect(TextInputActionApi.schema.safeParse({action, tooltipDirection: 'up'}).success).toBe(
      false,
    );
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(TextInputActionApi.schema.safeParse({action, disabled: {path: '/locked'}}).success).toBe(
      true,
    );
  });
});
