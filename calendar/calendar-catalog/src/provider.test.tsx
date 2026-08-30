import {render} from '@testing-library/react';
import {beforeEach, expect, test, vi} from 'vitest';
import {Provider, CALENDAR_TOKENS, CALENDAR_TOKENS_DARK} from './provider';

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
  const wrapper = container.querySelector('.calendar-catalog') as HTMLElement;
  expect(wrapper).not.toBeNull();
  for (const [token, value] of Object.entries(CALENDAR_TOKENS)) {
    expect(wrapper.style.getPropertyValue(token)).toBe(value);
    expect(document.documentElement.style.getPropertyValue(token)).toBe('');
  }
});

test('the dark palette covers exactly the same tokens as the light one', () => {
  // A token defined in only one appearance would fall through to the basic catalog's
  // default in the other, which is how a theme ends up half-applied in dark mode.
  expect(Object.keys(CALENDAR_TOKENS_DARK).sort()).toEqual(Object.keys(CALENDAR_TOKENS).sort());
});

test('dark appearance writes the dark palette', () => {
  stubAppearance(true);
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = container.querySelector('.calendar-catalog') as HTMLElement;
  expect(wrapper.style.getPropertyValue('--a2ui-color-surface')).toBe(
    CALENDAR_TOKENS_DARK['--a2ui-color-surface'],
  );
});

test('the wrapper stays out of layout', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const wrapper = container.querySelector('.calendar-catalog') as HTMLElement;
  expect(wrapper.style.display).toBe('contents');
});

test('no token reads a variable the bundle does not define', () => {
  // Decision 4: a catalog reading an ambient variable it never defines takes its appearance
  // from whichever catalog happened to set it. Calendar's product tokens are self-contained.
  for (const value of Object.values({...CALENDAR_TOKENS, ...CALENDAR_TOKENS_DARK})) {
    expect(value).not.toMatch(/var\(/);
  }
});

test('the card is ruled rather than lifted', () => {
  // The one structural inversion of Gmail's theme (task-2.7 decision 3): Calendar's agenda is
  // a flat ground with hairline rules, where Gmail's list is cards raised on a tinted one. The
  // cross-catalog half of this — that the two bundles actually resolve to different values —
  // is asserted in the client, where both catalogs are on the page at once.
  for (const tokens of [CALENDAR_TOKENS, CALENDAR_TOKENS_DARK]) {
    expect(tokens['--a2ui-card-box-shadow']).toBe('none');
    expect(tokens['--a2ui-card-border']).toMatch(/^1px solid /);
  }
});
