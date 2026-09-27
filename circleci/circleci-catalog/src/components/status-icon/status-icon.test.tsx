import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('a round glyph named by its word', () => {
  renderTree([{id: 'root', component: 'StatusIcon', status: {path: '/status'}}], {
    data: {status: 'failed'},
  });
  const icon = screen.getByRole('img', {name: 'failed'});
  expect(icon).toHaveAttribute('data-tone', 'failed');
  expect(icon).toHaveAttribute('data-size', 'medium');
});
