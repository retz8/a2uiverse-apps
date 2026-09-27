import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {StatusIconView} from './status-icon';
import {toneOf} from './tone';

test('the state type decides the drawing', () => {
  expect(toneOf('backlog', 'Backlog')).toBe('backlog');
  expect(toneOf('unstarted', 'Todo')).toBe('unstarted');
  expect(toneOf('started', 'In Progress')).toBe('started');
  expect(toneOf('started', 'In Review')).toBe('review');
  expect(toneOf('completed', 'Shipped')).toBe('completed');
  expect(toneOf('duplicate', 'Duplicate')).toBe('canceled');
});

test('a missing type falls back to the default state names', () => {
  expect(toneOf('', 'In Progress')).toBe('started');
  expect(toneOf('', 'Something else')).toBe('neutral');
});

test('the glyph is labelled with the team’s own name for the state', () => {
  const {getByRole} = render(<StatusIconView status="In Review" type="started" />);
  const icon = getByRole('img', {name: 'In Review'});
  expect(icon.getAttribute('data-tone')).toBe('review');
});

test('backlog is a dashed ring; completed a disc with a mark', () => {
  const {container, rerender} = render(<StatusIconView status="Backlog" type="backlog" />);
  expect(container.querySelector('circle')?.getAttribute('stroke-dasharray')).toBeTruthy();
  rerender(<StatusIconView status="Done" type="completed" />);
  expect(container.querySelector('circle')?.getAttribute('fill')).toBe('currentColor');
  expect(container.querySelector('path')).not.toBeNull();
});
