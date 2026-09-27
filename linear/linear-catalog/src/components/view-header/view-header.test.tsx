import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {ViewHeaderView} from './view-header';

test('a header reads its context, then its title', () => {
  const {container} = render(<ViewHeaderView context="A2uiverse" title="A2U-5" />);
  expect(container.querySelector('.lc-view-header-context')?.textContent).toBe('A2uiverse');
  expect(container.querySelector('.lc-view-header-title')?.textContent).toBe('A2U-5');
  expect(container.querySelector('.lc-view-header-sep')?.getAttribute('aria-hidden')).toBe('true');
});

test('with no context, the title stands alone', () => {
  const {container} = render(<ViewHeaderView title="My issues" />);
  expect(container.querySelector('.lc-view-header-sep')).toBeNull();
  expect(container.querySelector('.lc-view-header-trailing')).toBeNull();
});
