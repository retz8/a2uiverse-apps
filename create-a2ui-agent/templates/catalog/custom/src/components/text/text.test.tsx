import {render, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {TextView} from './text';

test('renders the text', () => {
  render(<TextView text="hello" />);
  expect(screen.getByText('hello')).toBeInTheDocument();
});

test('the variant picks the element', () => {
  render(<TextView text="title" variant="h1" />);
  expect(screen.getByText('title').tagName).toBe('H1');
});
