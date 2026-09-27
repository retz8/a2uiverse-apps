import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('a separator, horizontal unless asked otherwise', () => {
  renderTree([
    {id: 'root', component: 'Stack', children: ['h', 'v']},
    {id: 'h', component: 'Divider'},
    {id: 'v', component: 'Divider', orientation: 'vertical'},
  ]);
  const [horizontal, vertical] = screen.getAllByRole('separator');
  expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal');
  expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
});
