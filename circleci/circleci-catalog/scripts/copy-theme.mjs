/** `tsc` does not copy stylesheets: place the committed theme sheet beside the built JS. */
import {copyFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(packageRoot, 'dist'), {recursive: true});
copyFileSync(resolve(packageRoot, 'src/theme.css'), resolve(packageRoot, 'dist/theme.css'));
