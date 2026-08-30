/**
 * Generates `primer-scoped.css`: the Primer token sheets that declare at `:root`, rewritten to
 * the catalog's own scope element so nothing this bundle ships lands outside a fragment
 * boundary. Written to `src/` (what the package's own toolchain resolves) and `dist/` (what a
 * host installing the published package resolves); both are gitignored —
 * `prepare` regenerates them on install.
 */
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SCOPE = '.github-catalog-scope';
const SHEETS = [
  // --base-duration-* / --base-easing-* (Spinner's animation shorthand).
  '@primer/primitives/dist/css/base/motion/motion.css',
  // --borderWidth-* / --focus-outline-* (read bare by the functional theme sheets).
  '@primer/primitives/dist/css/functional/size/border.css',
];

const scoped = SHEETS.map(sheet => {
  const css = readFileSync(require.resolve(sheet), 'utf8');
  return `/* ${sheet}, ':root' rewritten to the scope element. */\n${css.replaceAll(':root', SCOPE)}`;
}).join('\n');

for (const out of ['src/primer-scoped.css', 'dist/primer-scoped.css']) {
  const path = resolve(packageRoot, out);
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, scoped);
}
