import {render} from '@testing-library/react';
import {beforeEach, expect, test, vi} from 'vitest';
import {FONT_STACK, Provider, TOKENS, TOKENS_DARK} from './provider';

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

const wrapperOf = (container: HTMLElement) =>
  container.querySelector('.linear-catalog') as HTMLElement;

test('tokens are written on the wrapper element, never the document root', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = wrapperOf(container);
  for (const [token, value] of Object.entries(TOKENS)) {
    expect(wrapper.style.getPropertyValue(token)).toBe(value);
    expect(document.documentElement.style.getPropertyValue(token)).toBe('');
  }
});

test('the dark palette covers exactly the same tokens as the light one', () => {
  expect(Object.keys(TOKENS_DARK).sort()).toEqual(Object.keys(TOKENS).sort());
});

test('dark appearance writes the dark palette', () => {
  stubAppearance(true);
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = wrapperOf(container);
  expect(wrapper.getAttribute('data-appearance')).toBe('dark');
  expect(wrapper.style.getPropertyValue('--lc-surface')).toBe(TOKENS_DARK['--lc-surface']);
});

test('the wrapper stays out of layout and sets the catalog’s own typeface', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = wrapperOf(container);
  expect(wrapper.style.display).toBe('contents');
  expect(FONT_STACK.startsWith("'linear-catalog-inter'")).toBe(true);
  expect(wrapper.style.fontFamily).toContain('linear-catalog-inter');
});

test('no token reads a variable the bundle does not define', () => {
  // A catalog reading an ambient variable it never defines takes its appearance from whichever
  // catalog happened to set it. The tokens are self-contained.
  for (const value of Object.values({...TOKENS, ...TOKENS_DARK})) {
    expect(value).not.toMatch(/var\(/);
  }
});
