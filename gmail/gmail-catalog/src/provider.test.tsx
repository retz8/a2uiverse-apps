import {readFileSync} from 'node:fs';
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

const wrapperOf = (container: HTMLElement) =>
  container.querySelector('.gmail-catalog') as HTMLElement;

test('the wrapper carries the catalog class, stays out of layout and writes nothing to the root', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = wrapperOf(container);
  expect(wrapper).not.toBeNull();
  expect(wrapper.style.display).toBe('contents');
  expect(wrapper.style.fontFamily).toContain('gmail-catalog-sans');
  expect(document.documentElement.getAttribute('style')).toBeNull();
});

test('the appearance follows the system', () => {
  expect(wrapperOf(render(<Provider>x</Provider>).container).dataset.appearance).toBe('light');
  stubAppearance(true);
  expect(wrapperOf(render(<Provider>x</Provider>).container).dataset.appearance).toBe('dark');
});

// Path from the package root (vitest's cwd).
const tokens = readFileSync('src/tokens.css', 'utf8');
const styles = readFileSync('src/styles.css', 'utf8');

const defined = (block: string) => [...block.matchAll(/(--gm-[\w-]+):/g)].map(m => m[1]);

test('the dark appearance redefines exactly the light colour tokens', () => {
  const [light, dark] = tokens.split("[data-appearance='dark']");
  const lightColors = defined(light).filter(name => name.startsWith('--gm-color-'));
  expect(defined(dark).sort()).toEqual(lightColors.sort());
});

test('every token the sheet reads is one the token sheet defines or carries a fallback', () => {
  const all = new Set(defined(tokens));
  for (const [, name, fallback] of styles.matchAll(/var\((--[\w-]+)(,)?/g)) {
    expect(all.has(name) || fallback === ',', `${name} is read but never defined`).toBe(true);
  }
});

test('every selector in both sheets sits under the wrapper class', () => {
  // Every rule's prelude; an at-rule's own prelude (@container, @font-face) is not a selector.
  const selectors = (css: string) =>
    (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+(?={)/g) ?? [])
      .map(prelude => prelude.trim())
      .filter(prelude => prelude && !prelude.startsWith('@'));
  for (const group of [...selectors(tokens), ...selectors(styles)]) {
    for (const selector of group.split(',')) {
      expect(selector.trim(), selector).toMatch(/^\.gmail-catalog\b/);
    }
  }
});

test("the typeface is declared under the catalog's own family name", () => {
  const families = [...styles.matchAll(/font-family:\s*'([^']+)'/g)].map(m => m[1]);
  expect(new Set(families)).toEqual(new Set(['gmail-catalog-sans']));
});
