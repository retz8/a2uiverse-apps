import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('a list of rows, joined by the tree connector when asked', () => {
  renderTree(
    [
      {
        id: 'root',
        component: 'List',
        connector: 'tree',
        children: {componentId: 'row', path: '/jobs'},
      },
      {id: 'row', component: 'ListItem', child: 'name'},
      {id: 'name', component: 'Text', text: {path: 'name'}},
    ],
    {data: {jobs: [{name: 'build'}, {name: 'test'}, {name: 'deploy'}]}},
  );
  const list = screen.getByRole('list');
  expect(list).toHaveAttribute('data-connector', 'tree');
  expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
    'build',
    'test',
    'deploy',
  ]);
});
