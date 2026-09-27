import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {levelOf} from './level';
import {PriorityIconView} from './priority-icon';

test('a priority reads from its name or its number', () => {
  expect(levelOf('Urgent')).toBe('urgent');
  expect(levelOf('2')).toBe('high');
  expect(levelOf('No priority')).toBe('none');
  expect(levelOf('')).toBe('none');
});

test('bars fill to the level', () => {
  const {container, rerender} = render(<PriorityIconView priority="High" />);
  expect(container.querySelectorAll('rect[data-filled]')).toHaveLength(3);
  rerender(<PriorityIconView priority="Low" />);
  expect(container.querySelectorAll('rect[data-filled]')).toHaveLength(1);
  expect(container.querySelectorAll('rect')).toHaveLength(3);
});

test('urgent is a square with a mark; none is dashes, labelled as such', () => {
  const {container, getByRole, rerender} = render(<PriorityIconView priority="Urgent" />);
  expect(container.querySelector('rect.lc-priority-urgent')).not.toBeNull();
  rerender(<PriorityIconView priority="" />);
  expect(getByRole('img', {name: 'No priority'}).getAttribute('data-level')).toBe('none');
  expect(container.querySelector('rect')).toBeNull();
});
