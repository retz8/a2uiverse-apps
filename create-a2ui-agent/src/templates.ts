/**
 * Template trees: copied as they are, with `__TOKEN__` placeholders substituted in file
 * contents and file names.
 *
 * A template is a real, readable skeleton of an app checked into this package; the only
 * transformation is the token pass. A token the caller did not supply is an error, so a typo
 * in a template can never reach a scaffolded app.
 */
import {mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';

export type Tokens = Readonly<Record<string, string>>;

const TOKEN = /__([A-Z][A-Z0-9_]*)__/g;

/** Files npm would rename or drop on publish are stored under a safe name. */
const RENAMES: Readonly<Record<string, string>> = {
  _gitignore: '.gitignore',
};

export function renderTemplate(text: string, tokens: Tokens, where: string): string {
  return text.replace(TOKEN, (match, name: string) => {
    const value = tokens[name];
    if (value === undefined) {
      throw new Error(`template ${where} uses ${match}, which the scaffold does not define`);
    }
    return value;
  });
}

function renderName(name: string, tokens: Tokens, where: string): string {
  return renderTemplate(RENAMES[name] ?? name, tokens, where);
}

/**
 * Copies `srcDir` into `destDir`, rendering tokens. Existing files are overwritten, which is
 * how an overlay (a kind- or option-specific tree) refines the common tree beneath it.
 * Returns the written paths relative to `destDir`.
 */
export function copyTemplateTree(srcDir: string, destDir: string, tokens: Tokens): string[] {
  const written: string[] = [];
  const walk = (from: string, to: string) => {
    mkdirSync(to, {recursive: true});
    for (const entry of readdirSync(from).sort()) {
      const source = join(from, entry);
      const target = join(to, renderName(entry, tokens, relative(srcDir, source)));
      if (statSync(source).isDirectory()) {
        walk(source, target);
        continue;
      }
      const text = readFileSync(source, 'utf8');
      writeFileSync(target, renderTemplate(text, tokens, relative(srcDir, source)));
      written.push(relative(destDir, target));
    }
  };
  walk(srcDir, destDir);
  return written;
}
