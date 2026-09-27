import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {ChipView} from './chip';

test('a chip draws its colour dot before its label', () => {
  const {container} = render(<ChipView label="Bug" color="#eb5757" />);
  const dot = container.querySelector<HTMLElement>('.lc-chip-dot');
  expect(dot?.style.background).toBe('rgb(235, 87, 87)');
  expect(container.querySelector('.lc-chip-label')?.textContent).toBe('Bug');
});

test('a colour that is not hex draws no dot', () => {
  const {container} = render(<ChipView label="Bug" color="url(https://x)" />);
  expect(container.querySelector('.lc-chip-dot')).toBeNull();
});

test('a leading visual takes the dot’s place', () => {
  const {container} = render(<ChipView label="Backlog" color="#fff" leading={<b>o</b>} />);
  expect(container.querySelector('.lc-chip-leading b')).not.toBeNull();
  expect(container.querySelector('.lc-chip-dot')).toBeNull();
});
