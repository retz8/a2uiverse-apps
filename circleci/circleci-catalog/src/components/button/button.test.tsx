import {fireEvent, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import type {A2uiClientAction} from '@a2ui/web_core/v0_9';
import {renderTree} from '../../testing/render';
import {ButtonApi} from './button.schema';

const action = {event: {name: 'confirm-rerun', context: {fromFailed: true}}};

test('a secondary medium pill by default, sending its action when pressed', () => {
  const actions: A2uiClientAction[] = [];
  renderTree([{id: 'root', component: 'Button', label: 'Rerun failed jobs', action}], {
    onAction: a => actions.push(a),
  });
  const button = screen.getByRole('button', {name: 'Rerun failed jobs'});
  expect(button).toHaveAttribute('data-variant', 'secondary');
  expect(button).toHaveAttribute('data-size', 'medium');
  fireEvent.click(button);
  expect(actions).toMatchObject([{name: 'confirm-rerun', context: {fromFailed: true}}]);
});

test('disabled follows its binding', () => {
  renderTree(
    [
      {
        id: 'root',
        component: 'Button',
        label: 'Cancel workflow',
        action,
        disabled: {path: '/ended'},
      },
    ],
    {data: {ended: true}},
  );
  expect(screen.getByRole('button', {name: 'Cancel workflow'})).toBeDisabled();
});

test('the label is required and the variants closed', () => {
  expect(ButtonApi.schema.safeParse({action}).success).toBe(false);
  expect(ButtonApi.schema.safeParse({label: 'x', action, variant: 'danger'}).success).toBe(false);
});
