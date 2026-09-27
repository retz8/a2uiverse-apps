import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {DividerApi} from './divider.schema';
import {DividerView} from './divider';

test('a divider is a separator and takes no props', () => {
  const {getByRole} = render(<DividerView />);
  expect(getByRole('separator')).toHaveClass('lc-divider');
  expect(DividerApi.schema.safeParse({}).success).toBe(true);
  expect(DividerApi.schema.safeParse({inset: true}).success).toBe(false);
});
