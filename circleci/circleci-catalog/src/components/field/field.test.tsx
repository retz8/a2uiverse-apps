import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('a muted label over its value', () => {
  renderTree(
    [
      {id: 'root', component: 'Field', label: 'Branch', child: 'value'},
      {id: 'value', component: 'Text', text: {path: '/branch'}},
    ],
    {data: {branch: 'feature/checkout'}},
  );
  const label = screen.getByText('Branch');
  expect(label).toHaveClass('circleci-field-label');
  expect(label.parentElement).toHaveTextContent('Branchfeature/checkout');
});
