/** `tsc` copies no assets: place the committed stylesheet and its typeface beside the built JS. */
import {cpSync, copyFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(packageRoot, 'dist'), {recursive: true});
copyFileSync(resolve(packageRoot, 'src/theme.css'), resolve(packageRoot, 'dist/theme.css'));
cpSync(resolve(packageRoot, 'src/fonts'), resolve(packageRoot, 'dist/fonts'), {recursive: true});
