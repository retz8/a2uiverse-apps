import {describe, it, expect} from 'vitest';
import {TreeViewErrorDialogApi} from './treeview-errordialog.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'retry-subtree', context: {}}};

describe('TreeViewErrorDialogApi.schema', () => {
  it('accepts a minimal valid ErrorDialog (children only)', () => {
    expect(TreeViewErrorDialogApi.schema.safeParse({children: ['body']}).success).toBe(true);
  });

  it('accepts a full-surface ErrorDialog', () => {
    expect(
      TreeViewErrorDialogApi.schema.safeParse({
        children: ['body'],
        title: 'Failed to load',
        retryAction: eventAction,
        dismissAction: fnAction,
      }).success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(TreeViewErrorDialogApi.schema.safeParse({title: 'Error'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      TreeViewErrorDialogApi.schema.safeParse({children: ['body'], color: 'red'}).success,
    ).toBe(false);
  });
});
