import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {PanelApi} from './panel.schema';
import {PanelView} from './panel';

test('a panel holds its child, padded by default', () => {
  const {container} = render(<PanelView>inside</PanelView>);
  const panel = container.querySelector('.lc-panel');
  expect(panel?.textContent).toBe('inside');
  expect(panel?.getAttribute('data-padding')).toBe('normal');
});

test('the schema takes one child and no other content', () => {
  expect(PanelApi.schema.safeParse({child: 'body'}).success).toBe(true);
  expect(PanelApi.schema.safeParse({children: ['a']}).success).toBe(false);
});
