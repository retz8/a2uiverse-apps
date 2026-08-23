import {describe, it, expect} from 'vitest';
import {ConfirmationDialogApi} from './confirmationdialog.schema';

const fnAction = {functionCall: {call: 'consoleLog', args: {message: 'm'}, returnType: 'void'}};
const eventAction = {event: {name: 'cd-confirm-delete', context: {}}};

describe('ConfirmationDialogApi.schema', () => {
  it('accepts a minimal valid ConfirmationDialog (title + both actions)', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'Discard changes?',
        confirmAction: fnAction,
        cancelAction: fnAction,
      }).success,
    ).toBe(true);
  });

  it('accepts a full-surface ConfirmationDialog', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'Delete branch?',
        confirmAction: eventAction,
        cancelAction: fnAction,
        cancelButtonContent: 'Keep',
        confirmButtonContent: 'Delete',
        confirmButtonType: 'danger',
        cancelButtonLoading: false,
        confirmButtonLoading: {path: '/cd/deleting'},
        overrideButtonFocus: 'cancel',
        width: 'large',
        height: 'small',
        children: ['cd-body'],
      }).success,
    ).toBe(true);
  });

  it('accepts bound (path) title and button labels', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: {path: '/cd/title'},
        confirmButtonContent: {path: '/cd/confirm'},
        cancelButtonContent: {path: '/cd/cancel'},
        confirmAction: fnAction,
        cancelAction: fnAction,
      }).success,
    ).toBe(true);
  });

  it('accepts a data-bound confirmButtonLoading (DynamicBoolean)', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'T',
        confirmAction: fnAction,
        cancelAction: fnAction,
        confirmButtonLoading: {path: '/cd/deleting'},
      }).success,
    ).toBe(true);
  });

  it('accepts a free CSS width value and a numeric width', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'T',
        confirmAction: fnAction,
        cancelAction: fnAction,
        width: '400px',
      }).success,
    ).toBe(true);
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'T',
        confirmAction: fnAction,
        cancelAction: fnAction,
        width: 400,
      }).success,
    ).toBe(true);
  });

  it('rejects a missing required title', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({confirmAction: fnAction, cancelAction: fnAction})
        .success,
    ).toBe(false);
  });

  it('rejects a missing required confirmAction', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({title: 'T', cancelAction: fnAction}).success,
    ).toBe(false);
  });

  it('rejects a missing required cancelAction', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({title: 'T', confirmAction: fnAction}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum confirmButtonType', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'T',
        confirmAction: fnAction,
        cancelAction: fnAction,
        confirmButtonType: 'invisible',
      }).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum height', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'T',
        confirmAction: fnAction,
        cancelAction: fnAction,
        height: 'medium',
      }).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum overrideButtonFocus', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'T',
        confirmAction: fnAction,
        cancelAction: fnAction,
        overrideButtonFocus: 'none',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      ConfirmationDialogApi.schema.safeParse({
        title: 'T',
        confirmAction: fnAction,
        cancelAction: fnAction,
        role: 'dialog',
      }).success,
    ).toBe(false);
  });
});
