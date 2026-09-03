/**
 * Where the kit lives and how a scaffolded agent pins it.
 *
 * The scaffolded agent depends on `a2ui-agent-kit` as a git dependency pinned to a commit
 * sha (task-3.4 decision 6). The CLI runs from the checkout that carries both the kit and
 * these templates, so HEAD of that checkout is the commit the templates were written against
 * — the one pin that makes a scaffold self-consistent.
 */
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {headSha, isDirty, isPushed, repoToplevel} from './git.js';

/** The repository the kit is fetched from; `subdirectory` is its path inside it. */
export const KIT_REPO_URL = 'https://github.com/retz8/a2uiverse-apps';
export const KIT_SUBDIRECTORY = 'agent-kit';
export const KIT_PACKAGE = 'a2ui-agent-kit';

/** This package's root: `dist/` and `src/` are both one level below it. */
export function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

export function templatesDir(): string {
  return resolve(packageRoot(), 'templates');
}

/** The apps checkout the CLI runs from, when it runs from one. */
export function kitCheckout(): string | undefined {
  const top = repoToplevel(packageRoot());
  if (!top || !existsSync(resolve(top, KIT_SUBDIRECTORY, 'pyproject.toml'))) return undefined;
  return top;
}

export interface KitPin {
  rev: string;
  warnings: string[];
}

/**
 * The sha to pin. An explicit override wins; otherwise HEAD of the checkout this CLI runs
 * from. Warns — never refuses — when that HEAD is not what an outside `uv sync` will get.
 */
export function resolveKitPin(override?: string): KitPin {
  if (override) return {rev: override, warnings: []};
  const checkout = kitCheckout();
  if (!checkout) {
    throw new Error(
      `create-a2ui-agent is not running from an ${KIT_REPO_URL} checkout, so it cannot ` +
        'read the kit commit to pin. Pass --kit-rev <sha>.',
    );
  }
  const sha = headSha(checkout);
  if (!sha) throw new Error(`Could not read HEAD of ${checkout}. Pass --kit-rev <sha>.`);
  const warnings: string[] = [];
  if (isDirty(checkout, [KIT_SUBDIRECTORY])) {
    warnings.push(
      `${KIT_SUBDIRECTORY}/ has uncommitted changes. The scaffold pins HEAD (${sha.slice(0, 12)}), ` +
        'not what is on disk.',
    );
  }
  if (!isPushed(checkout, sha)) {
    warnings.push(
      `HEAD ${sha.slice(0, 12)} is not on any remote branch yet. \`uv sync\` in the scaffolded ` +
        'agent fetches the kit from GitHub, so it will fail until this commit is pushed.',
    );
  }
  return {rev: sha, warnings};
}
