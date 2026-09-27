import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {TextView} from './text';

test('a title is the view heading, a heading a section heading', () => {
  const {getByRole} = render(
    <>
      <TextView text="Fix the retry loop" variant="title" />
      <TextView text="Activity" variant="heading" />
    </>,
  );
  expect(getByRole('heading', {level: 2}).textContent).toBe('Fix the retry loop');
  expect(getByRole('heading', {level: 3}).textContent).toBe('Activity');
});

test('body text is inline and plain, Markdown syntax shown as written', () => {
  const {container} = render(<TextView text="**not bold**" />);
  const span = container.querySelector('span.lc-text')!;
  expect(span.getAttribute('data-variant')).toBe('body');
  expect(span.textContent).toBe('**not bold**');
  expect(container.querySelector('strong')).toBeNull();
});

test('truncated text keeps the whole text as its tooltip', () => {
  const {container} = render(<TextView text="A long title" truncate weight="medium" />);
  const span = container.querySelector('.lc-text')!;
  expect(span.hasAttribute('data-truncate')).toBe(true);
  expect(span.getAttribute('title')).toBe('A long title');
  expect(span.getAttribute('data-weight')).toBe('medium');
});
