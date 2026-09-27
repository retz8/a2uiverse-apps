import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {AvatarView, initialsOf} from './avatar';

test('initials come from the first and last words', () => {
  expect(initialsOf('Jioh In')).toBe('JI');
  expect(initialsOf('Mira Kovač')).toBe('MK');
  expect(initialsOf('dev-okafor')).toBe('D');
  expect(initialsOf('Ana de la Cruz')).toBe('AC');
  expect(initialsOf('  ')).toBe('?');
});

test('an avatar is named by the whole name', () => {
  const {getByRole} = render(<AvatarView name="Jioh In" />);
  const avatar = getByRole('img', {name: 'Jioh In'});
  expect(avatar.textContent).toBe('JI');
  expect(avatar.getAttribute('data-size')).toBe('small');
});
