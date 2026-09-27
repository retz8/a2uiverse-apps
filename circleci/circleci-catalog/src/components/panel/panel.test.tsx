import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('holds its child in a bordered panel, medium padding and default tone by default', () => {
  renderTree([
    {id: 'root', component: 'Panel', child: 'body'},
    {id: 'body', component: 'Text', text: 'inside'},
  ]);
  const panel = screen.getByText('inside').parentElement!;
  expect(panel).toHaveClass('circleci-panel');
  expect(panel).toHaveAttribute('data-padding', 'medium');
  expect(panel).toHaveAttribute('data-tone', 'default');
});

test('danger marks a failure', () => {
  renderTree([
    {id: 'root', component: 'Panel', child: 'body', tone: 'danger'},
    {id: 'body', component: 'Text', text: 'Lint files'},
  ]);
  expect(screen.getByText('Lint files').parentElement).toHaveAttribute('data-tone', 'danger');
});
