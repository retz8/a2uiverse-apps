import {fireEvent, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import type {A2uiClientAction} from '@a2ui/web_core/v0_9';
import {renderTree} from '../../testing/render';

test('without an action, a row only shows', () => {
  renderTree([
    {id: 'root', component: 'ListItem', child: 'name'},
    {id: 'name', component: 'Text', text: 'lint'},
  ]);
  expect(screen.getByRole('listitem')).toHaveTextContent('lint');
  expect(screen.queryByRole('button')).toBeNull();
});

test('with an action, the whole row is one button carrying its own target', () => {
  const actions: A2uiClientAction[] = [];
  renderTree(
    [
      {id: 'root', component: 'List', children: {componentId: 'row', path: '/jobs'}},
      {
        id: 'row',
        component: 'ListItem',
        child: 'name',
        action: {event: {name: 'open-job', context: {jobId: {path: 'id'}}}},
      },
      {id: 'name', component: 'Text', text: {path: 'name'}},
    ],
    {
      data: {
        jobs: [
          {id: 'job-1', name: 'build'},
          {id: 'job-2', name: 'test'},
        ],
      },
      onAction: action => actions.push(action),
    },
  );
  fireEvent.click(screen.getByRole('button', {name: 'test'}));
  expect(actions).toMatchObject([{name: 'open-job', context: {jobId: 'job-2'}}]);
});
