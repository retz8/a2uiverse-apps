/**
 * The sheets restating Primer's rules — for children that are components of their own, and for a
 * PageLayout in a fragment narrower than Primer's breakpoint — name Primer's own classes, which
 * carry a hash of their Primer version: each must be one Primer's stylesheets declare, or its rule
 * quietly matches nothing.
 */
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {expect, it} from 'vitest';

// Paths from the package root (vitest's cwd).
const sheets = ['src/primer-children.css', 'src/primer-narrow.css'];
const primerDist = dirname(
  createRequire(join(process.cwd(), 'package.json')).resolve('@primer/react'),
);

const declared = new Set(
  readdirSync(primerDist, {recursive: true, encoding: 'utf8'})
    .filter(file => file.endsWith('.css'))
    .flatMap(file => readFileSync(join(primerDist, file), 'utf8').match(/prc-[\w-]+/g) ?? []),
);

it.each(sheets)("%s names only classes Primer's stylesheets declare", path => {
  const named = new Set(readFileSync(path, 'utf8').match(/prc-[\w-]+/g));
  expect(named.size).toBeGreaterThan(0);
  for (const name of named) expect(declared.has(name), name).toBe(true);
});

it("holds the narrow PageLayout to the fragment's width, at Primer's own breakpoint", () => {
  const narrow = readFileSync('src/primer-narrow.css', 'utf8');
  const primerBreakpoint = readdirSync(primerDist, {recursive: true, encoding: 'utf8'})
    .filter(file => /PageLayout-[\w]+\.css$/.test(file))
    .map(file => readFileSync(join(primerDist, file), 'utf8'))
    .join('')
    .match(/@media \(max-width:(calc\([^)]*\))\)/)?.[1];
  expect(primerBreakpoint).toBe('calc(48rem - 0.02px)');
  expect(narrow).toContain('container: github-catalog / inline-size;');
  expect(narrow).toContain('@container github-catalog (max-width: calc(48rem - 0.02px)) {');
  // Every PageLayout rule sits inside the container query, none outside it.
  const outside = narrow.slice(0, narrow.indexOf('@container'));
  expect(outside).not.toMatch(/prc-PageLayout/);
});
