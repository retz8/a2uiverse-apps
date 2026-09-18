import {render, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {StatusIconView} from './status-icon';
import {toneOf} from './tone';

test("the server's state types decide the drawing", () => {
  expect(toneOf('backlog', 'Backlog')).toBe('backlog');
  expect(toneOf('unstarted', 'Todo')).toBe('unstarted');
  expect(toneOf('started', 'In Progress')).toBe('started');
  expect(toneOf('completed', 'Done')).toBe('completed');
  expect(toneOf('canceled', 'Canceled')).toBe('canceled');
  expect(toneOf('duplicate', 'Duplicate')).toBe('canceled');
});

test('a team-named started state draws as started; In Review keeps its own look', () => {
  expect(toneOf('started', 'Coding')).toBe('started');
  expect(toneOf('started', 'In Review')).toBe('review');
});

test("with no type, Linear's default names still resolve; anything else is neutral", () => {
  expect(toneOf('', 'Todo')).toBe('unstarted');
  expect(toneOf('', 'Done')).toBe('completed');
  expect(toneOf('', 'Waiting')).toBe('neutral');
});

test("the icon is labelled with the team's own name for the state", () => {
  render(<StatusIconView status="In Progress" type="started" />);
  const icon = screen.getByRole('img', {name: 'In Progress'});
  expect(icon).toHaveAttribute('data-tone', 'started');
  expect(icon).toHaveClass('linear-status');
});
