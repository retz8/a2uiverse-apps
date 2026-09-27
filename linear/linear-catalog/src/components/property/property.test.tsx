import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {PropertyView} from './property';

test('a property sets its label beside its value', () => {
  const {container} = render(<PropertyView label="Status">In Review</PropertyView>);
  expect(container.querySelector('.lc-property-label')?.textContent).toBe('Status');
  expect(container.querySelector('.lc-property-value')?.textContent).toBe('In Review');
});
