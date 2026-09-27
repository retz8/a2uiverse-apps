import {expect, test} from 'vitest';
import {renderTree} from '../../testing/render';

test('the lines as printed, in order, one component each', () => {
  const lines = [
    'FAIL src/checkout/payment.test.ts',
    "  expected 'address' to be 'payment'",
    'Tests  1 failed',
  ];
  const {container} = renderTree(
    [
      {id: 'root', component: 'LogBlock', children: {componentId: 'line', path: '/lines'}},
      {id: 'line', component: 'LogLine', text: {path: 'text'}},
    ],
    {data: {lines: lines.map(text => ({text}))}},
  );
  const block = container.querySelector('.circleci-log-block')!;
  const rendered = [...block.querySelectorAll('.circleci-log-line')].map(line => line.textContent);
  expect(rendered).toEqual(lines);
});
