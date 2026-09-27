import {render} from '@testing-library/react';
import {beforeEach, expect, test, vi} from 'vitest';
import {Provider} from './provider';

/** jsdom has no matchMedia; the Provider must render without one and default to light. */
function stubAppearance(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

function wrapperOf(container: HTMLElement) {
  const wrapper = container.querySelector<HTMLElement>('.circleci-catalog');
  expect(wrapper).not.toBeNull();
  return wrapper as HTMLElement;
}

test('one wrapper carries the catalog class and stays out of layout', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = wrapperOf(container);
  expect(wrapper.style.display).toBe('contents');
  expect(wrapper).toHaveTextContent('content');
});

test('the wrapper follows the OS appearance, light by default', () => {
  expect(wrapperOf(render(<Provider>x</Provider>).container)).toHaveAttribute(
    'data-appearance',
    'light',
  );
  stubAppearance(true);
  expect(wrapperOf(render(<Provider>x</Provider>).container)).toHaveAttribute(
    'data-appearance',
    'dark',
  );
});

test('nothing is written on the document root', () => {
  render(<Provider>x</Provider>);
  expect(document.documentElement.getAttribute('style')).toBeNull();
  expect(document.documentElement.className).toBe('');
});
