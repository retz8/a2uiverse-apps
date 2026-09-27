import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {StackView} from './stack';

test('a stack defaults to a column with the small gap', () => {
  const {container} = render(<StackView>a</StackView>);
  const stack = container.querySelector('.lc-stack')!;
  expect(stack.getAttribute('data-direction')).toBe('vertical');
  expect(stack.getAttribute('data-gap')).toBe('s');
  expect(stack.hasAttribute('data-wrap')).toBe(false);
});

test('a row carries its alignment to the sheet', () => {
  const {container} = render(
    <StackView direction="horizontal" align="center" justify="space-between" wrap>
      a
    </StackView>,
  );
  const stack = container.querySelector('.lc-stack')!;
  expect(stack.getAttribute('data-direction')).toBe('horizontal');
  expect(stack.getAttribute('data-align')).toBe('center');
  expect(stack.getAttribute('data-justify')).toBe('space-between');
  expect(stack.getAttribute('data-wrap')).toBe('wrap');
});
