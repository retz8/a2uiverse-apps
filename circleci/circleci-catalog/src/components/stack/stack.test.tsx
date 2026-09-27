import {screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';
import {StackApi} from './stack.schema';

test('lays out its children in order, vertical and small-gapped by default', () => {
  renderTree([
    {id: 'root', component: 'Stack', children: ['a', 'b']},
    {id: 'a', component: 'Text', text: 'first'},
    {id: 'b', component: 'Text', text: 'second'},
  ]);
  const stack = screen.getByText('first').parentElement!;
  expect(stack).toHaveClass('circleci-stack');
  expect(stack).toHaveAttribute('data-direction', 'vertical');
  expect(stack).toHaveAttribute('data-gap', 'small');
  expect(stack).toHaveTextContent('firstsecond');
});

test('a template renders one child per item, each bound in its own scope', () => {
  renderTree(
    [
      {
        id: 'root',
        component: 'Stack',
        direction: 'horizontal',
        children: {componentId: 'item', path: '/runs'},
      },
      {id: 'item', component: 'Text', text: {path: 'branch'}},
    ],
    {data: {runs: [{branch: 'main'}, {branch: 'fix/cart'}]}},
  );
  expect(screen.getByText('main')).toBeInTheDocument();
  expect(screen.getByText('fix/cart')).toBeInTheDocument();
});

test('the schema is strict and its enums closed', () => {
  expect(StackApi.schema.safeParse({gap: 'huge'}).success).toBe(false);
  expect(StackApi.schema.safeParse({color: 'red'}).success).toBe(false);
  expect(StackApi.schema.safeParse({justify: 'spaceBetween', wrap: true}).success).toBe(true);
});
