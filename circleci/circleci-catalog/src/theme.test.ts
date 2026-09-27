/**
 * The stylesheet keeps to its wrapper: every rule is led by `.circleci-catalog`, nothing is
 * declared at the document root, both appearances define the same tokens, and every token read
 * is one the sheet defines — so the catalog's look never depends on what else is on the page.
 */
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

// Path from the package root (vitest's cwd).
const css = readFileSync('src/theme.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Each rule's selector list and body, at-rules aside. */
function rules(): {selector: string; body: string}[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
    selector: m[1].trim(),
    body: m[2],
  }));
}

/** A selector list's selectors, split at top-level commas only — not inside `:is(...)`. */
function selectorsOf(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of list) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += char;
  }
  return [...parts, current.trim()];
}

const defined = (body: string) => new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));

describe('theme.css', () => {
  it('leads every rule with the wrapper class', () => {
    for (const {selector} of rules()) {
      if (selector.startsWith('@font-face')) continue;
      for (const part of selectorsOf(selector)) {
        expect(part, selector).toMatch(/^\.circleci-catalog(?![\w-])/);
      }
    }
  });

  it('defines the same tokens in both appearances', () => {
    const light = rules().find(r => r.selector === '.circleci-catalog');
    const dark = rules().find(r => r.selector === ".circleci-catalog[data-appearance='dark']");
    const fonts = new Set(['--circleci-font', '--circleci-font-mono']);
    const lightTokens = [...defined(light!.body)].filter(t => !fonts.has(t)).sort();
    expect([...defined(dark!.body)].sort()).toEqual(lightTokens);
  });

  it('reads only tokens it defines', () => {
    const all = defined(css);
    for (const read of css.matchAll(/var\(\s*(--[\w-]+)/g)) {
      expect(all.has(read[1]), `${read[1]} is read but never defined`).toBe(true);
    }
  });

  it('wraps a horizontal Stack inside a horizontal Stack, so its peers never slide under the next', () => {
    const nested = rules().find(r =>
      /\.circleci-stack\[data-direction='horizontal'\]\s*>\s*\.circleci-stack\[data-direction='horizontal'\]$/.test(
        r.selector,
      ),
    );
    expect(nested?.body).toMatch(/flex-wrap:\s*wrap/);
  });

  it('keeps a row of Fields whole: each field no narrower than its words, stacked in a narrow panel', () => {
    const panel = rules().find(r => r.selector === '.circleci-catalog .circleci-panel');
    expect(panel?.body).toMatch(/container:\s*circleci-panel\s*\/\s*inline-size/);
    const floor = rules().find(r =>
      /\.circleci-stack\[data-direction='horizontal'\]\s*>\s*\.circleci-field$/.test(r.selector),
    );
    expect(floor?.body).toMatch(/min-width:\s*min-content/);
    const narrow = css.match(
      /@container circleci-panel \(max-width: 26rem\) \{([\s\S]*?)\n\}/,
    )?.[1];
    expect(narrow).toMatch(/:has\(> \.circleci-field\)\s*\{\s*flex-direction:\s*column/);
    expect(narrow).toMatch(
      /:has\(> \.circleci-field\)\s*> \.circleci-divider\[data-orientation='vertical'\]\s*\{\s*display:\s*none/,
    );
  });

  it('owns its typeface family and its counter', () => {
    expect(css).toMatch(/font-family:\s*'circleci-catalog-inter'/);
    for (const counter of css.matchAll(/counter-(?:reset|increment):\s*([\w-]+)/g)) {
      expect(counter[1]).toMatch(/^circleci-/);
    }
  });
});
