import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('each row of a template draws its own status, toned by its word', () => {
  renderTree(
    [
      {id: 'root', component: 'Stack', children: {componentId: 'badge', path: '/runs'}},
      {id: 'badge', component: 'StatusBadge', status: {path: 'status'}},
    ],
    {data: {runs: [{status: 'Failed'}, {status: 'Success'}, {status: 'Canceled'}]}},
  );
  expect(screen.getByText('Failed')).toHaveAttribute('data-tone', 'failed');
  expect(screen.getByText('Success')).toHaveAttribute('data-tone', 'success');
  expect(screen.getByText('Canceled')).toHaveAttribute('data-tone', 'neutral');
});

test('the word is the pill’s name; the glyph is decoration', () => {
  renderTree([{id: 'root', component: 'StatusBadge', status: 'Running'}]);
  const badge = screen.getByText('Running');
  expect(badge).toHaveClass('circleci-status-badge');
  expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});
