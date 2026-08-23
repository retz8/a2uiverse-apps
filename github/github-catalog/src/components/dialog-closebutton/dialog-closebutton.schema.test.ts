import {describe, it, expect} from 'vitest';
import {DialogCloseButtonApi} from './dialog-closebutton.schema';

const fnAction = {
  functionCall: {call: 'consoleLog', args: {message: 'closebutton'}, returnType: 'void'},
};
const eventAction = {event: {name: 'dialog-close', context: {}}};

describe('DialogCloseButtonApi.schema', () => {
  it('accepts a functionCall closeAction', () => {
    expect(DialogCloseButtonApi.schema.safeParse({closeAction: fnAction}).success).toBe(true);
  });

  it('accepts an event closeAction', () => {
    expect(DialogCloseButtonApi.schema.safeParse({closeAction: eventAction}).success).toBe(true);
  });

  it('rejects a missing required closeAction', () => {
    expect(DialogCloseButtonApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      DialogCloseButtonApi.schema.safeParse({closeAction: fnAction, color: 'red'}).success,
    ).toBe(false);
  });
});
