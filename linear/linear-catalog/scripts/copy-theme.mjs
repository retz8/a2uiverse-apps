/** `tsc` copies no assets: place the sheet and the font it loads beside the built JS. */
import {copyFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(packageRoot, 'dist');
mkdirSync(resolve(dist, 'fonts'), {recursive: true});
copyFileSync(resolve(packageRoot, 'src/theme.css'), resolve(dist, 'theme.css'));
for (const file of ['inter-latin-opsz-normal.woff2', 'OFL.txt']) {
  copyFileSync(resolve(packageRoot, 'src/fonts', file), resolve(dist, 'fonts', file));
}
