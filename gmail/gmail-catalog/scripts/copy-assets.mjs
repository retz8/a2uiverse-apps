/** `tsc` copies no assets: place the sheets and the fonts they load beside the built JS. */
import {copyFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(packageRoot, 'dist');
mkdirSync(resolve(dist, 'fonts'), {recursive: true});
for (const sheet of ['tokens.css', 'styles.css']) {
  copyFileSync(resolve(packageRoot, 'src', sheet), resolve(dist, sheet));
}
for (const file of [
  'google-sans-latin-opsz-normal.woff2',
  'google-sans-latin-ext-opsz-normal.woff2',
  'OFL.txt',
]) {
  copyFileSync(resolve(packageRoot, 'src/fonts', file), resolve(dist, 'fonts', file));
}
