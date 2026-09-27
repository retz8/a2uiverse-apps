import {fireEvent, render} from '@testing-library/react';
import {expect, test, vi} from 'vitest';
import {ButtonApi} from './button.schema';
import {ButtonView} from './button';

test('a button is named by its label and fires its action', () => {
  const onClick = vi.fn();
  const {getByRole} = render(<ButtonView label="Move to In Progress" onClick={onClick} />);
  const button = getByRole('button', {name: 'Move to In Progress'});
  expect(button.getAttribute('data-variant')).toBe('secondary');
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});

test('a disabled button does not fire', () => {
  const onClick = vi.fn();
  const {getByRole} = render(<ButtonView label="Post comment" disabled onClick={onClick} />);
  fireEvent.click(getByRole('button'));
  expect(onClick).not.toHaveBeenCalled();
});

test('a button needs a label and an action', () => {
  const action = {event: {name: 'confirm-change'}};
  expect(ButtonApi.schema.safeParse({label: 'Keep as is', action}).success).toBe(true);
  expect(ButtonApi.schema.safeParse({label: 'Keep as is'}).success).toBe(false);
  expect(ButtonApi.schema.safeParse({child: 'label', action}).success).toBe(false);
});
