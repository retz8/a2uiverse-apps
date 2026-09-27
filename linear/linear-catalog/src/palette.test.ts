import {expect, test} from 'vitest';
import {INPUTS, MERCURY_WHITE, NORDIC_GRAY, avatarColor, generateTheme, lch} from './palette';

const light = generateTheme(INPUTS.light, 'light');
const dark = generateTheme(INPUTS.dark, 'dark');

/** The lightness of an `lch()` token. */
const lightness = (value: string) => Number(/^lch\(([\d.]+)%/.exec(value)?.[1]);

test('the pages are the brand colours Linear publishes', () => {
  expect(light['--lc-page']).toBe(lch(MERCURY_WHITE));
  expect(dark['--lc-page']).toBe(lch(NORDIC_GRAY));
});

test('every token is an lch() value, never a variable', () => {
  for (const value of [...Object.values(light), ...Object.values(dark)]) {
    expect(value).toMatch(/^lch\([\d.]+% [\d.]+ [\d.]+( \/ [\d.]+)?\)$/);
  }
});

test('text stands off the page by the contrast, in both appearances', () => {
  for (const theme of [light, dark]) {
    const page = lightness(theme['--lc-page']);
    const text = Math.abs(lightness(theme['--lc-text']) - page);
    const secondary = Math.abs(lightness(theme['--lc-text-secondary']) - page);
    const tertiary = Math.abs(lightness(theme['--lc-text-tertiary']) - page);
    expect(text).toBeGreaterThan(secondary);
    expect(secondary).toBeGreaterThan(tertiary);
    expect(tertiary).toBeGreaterThan(30);
  }
});

test('a higher contrast pushes text further from the page', () => {
  const high = generateTheme({...INPUTS.light, contrast: 36}, 'light');
  expect(lightness(high['--lc-text'])).toBeLessThan(lightness(light['--lc-text']));
});

test('a panel rises from the page in both appearances', () => {
  expect(lightness(light['--lc-surface'])).toBeGreaterThan(lightness(light['--lc-page']));
  expect(lightness(dark['--lc-surface'])).toBeGreaterThan(lightness(dark['--lc-page']));
});

test('an avatar keeps one colour per name', () => {
  expect(avatarColor('Jioh In')).toBe(avatarColor('Jioh In'));
  expect(avatarColor('')).toMatch(/^lch\(/);
});
