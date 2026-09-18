import {render, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {PriorityIconView} from './priority-icon';
import {levelOf} from './level';

test("Linear's priority words and numbers map to a level", () => {
  expect(levelOf('Urgent')).toBe('urgent');
  expect(levelOf('High')).toBe('high');
  expect(levelOf('Medium')).toBe('medium');
  expect(levelOf('Low')).toBe('low');
  expect(levelOf('No priority')).toBe('none');
  expect(levelOf('1')).toBe('urgent');
  expect(levelOf('0')).toBe('none');
});

test('an unknown word draws as no priority, never a guessed level', () => {
  expect(levelOf('Critical')).toBe('none');
  expect(levelOf('')).toBe('none');
});

test('the icon is labelled with the word and fills its bars by level', () => {
  const {container} = render(<PriorityIconView priority="Medium" />);
  const icon = screen.getByRole('img', {name: 'Medium'});
  expect(icon).toHaveAttribute('data-level', 'medium');
  const opacities = [...container.querySelectorAll('rect')].map(r =>
    r.getAttribute('fill-opacity'),
  );
  expect(opacities).toEqual(['1', '1', '0.4']);
});

test('an empty priority is labelled as no priority', () => {
  render(<PriorityIconView priority="" />);
  expect(screen.getByRole('img', {name: 'No priority'})).toHaveAttribute('data-level', 'none');
});
