import {render} from '@testing-library/react';
import {useEffect, useState} from 'react';
import {useMarkdownRenderer} from '@a2ui/react/v0_9';
import {beforeEach, expect, test, vi} from 'vitest';
import {Provider, TOKENS, TOKENS_DARK} from './provider';

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

test('tokens are written on the wrapper element, never the document root', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = container.querySelector('.linear-catalog') as HTMLElement;
  expect(wrapper).not.toBeNull();
  for (const [token, value] of Object.entries(TOKENS)) {
    expect(wrapper.style.getPropertyValue(token)).toBe(value);
    expect(document.documentElement.style.getPropertyValue(token)).toBe('');
  }
});

test('the dark palette covers exactly the same tokens as the light one', () => {
  // A token defined in only one appearance would fall through to the basic catalog's
  // default in the other, which is how a theme ends up half-applied in dark mode.
  expect(Object.keys(TOKENS_DARK).sort()).toEqual(Object.keys(TOKENS).sort());
});

test('dark appearance writes the dark palette', () => {
  stubAppearance(true);
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = container.querySelector('.linear-catalog') as HTMLElement;
  expect(wrapper.style.getPropertyValue('--a2ui-color-surface')).toBe(
    TOKENS_DARK['--a2ui-color-surface'],
  );
});

test('the wrapper stays out of layout', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = container.querySelector('.linear-catalog') as HTMLElement;
  expect(wrapper.style.display).toBe('contents');
});

test('no token reads a variable the bundle does not define', () => {
  // A catalog reading an ambient variable it never defines takes its appearance from
  // whichever catalog happened to set it. The product tokens are self-contained.
  for (const value of Object.values({...TOKENS, ...TOKENS_DARK})) {
    expect(value).not.toMatch(/var\(/);
  }
});

test('body text inside the Provider renders through the bundle markdown renderer', async () => {
  const {findByText, container} = render(
    <Provider>
      <A2uiText />
    </Provider>,
  );
  expect(await findByText('GitHub issue', {exact: false})).toBeTruthy();
  expect(container.querySelector('strong')?.textContent).toBe('synced');
  expect(container.querySelector('a')).toBeNull();
});

/** A child reading the context the Provider installs, as upstream's body `Text` does. */
function A2uiText() {
  const renderer = useMarkdownRenderer();
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    void renderer?.('**synced** to a [GitHub issue](https://github.com/x/y/issues/3)').then(
      setHtml,
    );
  }, [renderer]);
  return html === null ? null : <div dangerouslySetInnerHTML={{__html: html}} />;
}
