import {describe, it, expect} from 'vitest';
import {DialogButtonsApi} from './dialog-buttons.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'save-changes', context: {}}};

describe('DialogButtonsApi.schema', () => {
  it('accepts a buttons row with both action shapes', () => {
    expect(
      DialogButtonsApi.schema.safeParse({
        buttons: [
          {content: 'Save', buttonType: 'primary', action: eventAction},
          {content: 'Cancel', buttonType: 'default', action: fnAction},
        ],
      }).success,
    ).toBe(true);
  });

  it('accepts a bound disabled/loading and autoFocus on an entry', () => {
    expect(
      DialogButtonsApi.schema.safeParse({
        buttons: [
          {
            content: 'Go',
            action: fnAction,
            autoFocus: true,
            disabled: {path: '/busy'},
            loading: {path: '/busy'},
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects a missing required buttons', () => {
    expect(DialogButtonsApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects an out-of-enum buttonType', () => {
    expect(
      DialogButtonsApi.schema.safeParse({
        buttons: [{content: 'X', buttonType: 'ghost', action: fnAction}],
      }).success,
    ).toBe(false);
  });

  it('rejects a button entry missing required action', () => {
    expect(DialogButtonsApi.schema.safeParse({buttons: [{content: 'X'}]}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      DialogButtonsApi.schema.safeParse({buttons: [{content: 'X', action: fnAction}], color: 'red'})
        .success,
    ).toBe(false);
  });
});
