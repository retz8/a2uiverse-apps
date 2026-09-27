import {fireEvent, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import type {A2uiClientAction} from '@a2ui/web_core/v0_9';
import {renderTree} from '../../testing/render';

test('pressing it sends its action with the bound context', () => {
  const actions: A2uiClientAction[] = [];
  renderTree(
    [
      {
        id: 'root',
        component: 'Link',
        text: {path: '/branch'},
        action: {event: {name: 'open-run', context: {runId: {path: '/id'}}}},
      },
    ],
    {data: {branch: 'main', id: 'run-7'}, onAction: action => actions.push(action)},
  );
  const link = screen.getByRole('button', {name: 'main'});
  expect(link).toHaveClass('circleci-link');
  fireEvent.click(link);
  expect(actions).toMatchObject([{name: 'open-run', context: {runId: 'run-7'}}]);
});
