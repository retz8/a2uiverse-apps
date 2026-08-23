import {describe, it, expect} from 'vitest';
import {DialogApi} from './dialog.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'dialog-close', context: {}}};

describe('DialogApi.schema', () => {
  it('accepts a minimal valid Dialog (title + closeAction)', () => {
    expect(
      DialogApi.schema.safeParse({title: 'Delete this file?', closeAction: fnAction}).success,
    ).toBe(true);
  });

  it('accepts a full-surface Dialog', () => {
    expect(
      DialogApi.schema.safeParse({
        title: 'Delete this file?',
        subtitle: 'This action cannot be undone',
        children: ['dialog-body'],
        closeAction: eventAction,
        footerButtons: [
          {content: 'Later', buttonType: 'default', action: fnAction},
          {content: 'Save', buttonType: 'primary', autoFocus: true, action: fnAction},
          {
            content: 'Delete',
            buttonType: 'danger',
            disabled: {path: '/deleted'},
            action: eventAction,
          },
          {content: 'Dismiss', buttonType: 'normal', action: fnAction},
        ],
        role: 'alertdialog',
        width: 'large',
        height: 'small',
        position: 'left',
        align: 'top',
      }).success,
    ).toBe(true);
  });

  it('accepts bound (path) title and subtitle', () => {
    expect(
      DialogApi.schema.safeParse({
        title: {path: '/dialog/title'},
        subtitle: {path: '/dialog/subtitle'},
        closeAction: fnAction,
      }).success,
    ).toBe(true);
  });

  it('accepts a free CSS width value and a numeric width', () => {
    expect(
      DialogApi.schema.safeParse({title: 'T', closeAction: fnAction, width: '400px'}).success,
    ).toBe(true);
    expect(
      DialogApi.schema.safeParse({title: 'T', closeAction: fnAction, width: 400}).success,
    ).toBe(true);
  });

  it('accepts the responsive-object position arm', () => {
    expect(
      DialogApi.schema.safeParse({
        title: 'T',
        closeAction: fnAction,
        position: {narrow: 'bottom', regular: 'right'},
      }).success,
    ).toBe(true);
  });

  it('rejects a missing required title', () => {
    expect(DialogApi.schema.safeParse({closeAction: fnAction}).success).toBe(false);
  });

  it('accepts a Dialog without closeAction (optional custom close hook)', () => {
    expect(DialogApi.schema.safeParse({title: 'T'}).success).toBe(true);
  });

  it('accepts a bound open path (two-way controlled visibility)', () => {
    expect(DialogApi.schema.safeParse({title: 'T', open: {path: '/dialogOpen'}}).success).toBe(
      true,
    );
  });

  it('accepts a literal boolean open', () => {
    expect(DialogApi.schema.safeParse({title: 'T', open: true}).success).toBe(true);
  });

  it('rejects an out-of-enum role', () => {
    expect(
      DialogApi.schema.safeParse({title: 'T', closeAction: fnAction, role: 'popup'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum height', () => {
    expect(
      DialogApi.schema.safeParse({title: 'T', closeAction: fnAction, height: 'medium'}).success,
    ).toBe(false);
  });

  it('rejects a footerButton missing required content', () => {
    expect(
      DialogApi.schema.safeParse({
        title: 'T',
        closeAction: fnAction,
        footerButtons: [{action: fnAction}],
      }).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      DialogApi.schema.safeParse({title: 'T', closeAction: fnAction, color: 'red'}).success,
    ).toBe(false);
  });
});
