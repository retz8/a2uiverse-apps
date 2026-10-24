/**
 * The sheet of Primer's rules restated for children that are components of their own names Primer's
 * own classes, which carry a hash of their Primer version: each must be one Primer's stylesheets
 * declare, or its rule quietly matches nothing.
 */
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {expect, it} from 'vitest';

// Paths from the package root (vitest's cwd).
const sheet = readFileSync('src/primer-children.css', 'utf8');
const primerDist = dirname(
  createRequire(join(process.cwd(), 'package.json')).resolve('@primer/react'),
);

const declared = new Set(
  readdirSync(primerDist, {recursive: true, encoding: 'utf8'})
    .filter(file => file.endsWith('.css'))
    .flatMap(file => readFileSync(join(primerDist, file), 'utf8').match(/prc-[\w-]+/g) ?? []),
);

it("names only classes Primer's stylesheets declare", () => {
  const named = new Set(sheet.match(/prc-[\w-]+/g));
  expect(named.size).toBeGreaterThan(0);
  for (const name of named) expect(declared.has(name), name).toBe(true);
});
