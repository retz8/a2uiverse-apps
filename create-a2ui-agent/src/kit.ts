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

import {
  headSha,
  isDirty,
  isPushed,
  lastPushedAncestor,
  pathsChangedBetween,
  repoToplevel,
} from './git.js';

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
 * from — or, when HEAD is not pushed, the newest ancestor that is. A scaffold pinned to an
 * unfetchable commit cannot install at all, so falling back to the newest fetchable one keeps
 * the generated app working; what the fallback leaves out is said plainly instead.
 * Warns — never refuses — when the pin is not what an outside `uv sync` would get from HEAD.
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
    const pushed = lastPushedAncestor(checkout);
    if (!pushed || pushed === sha) {
      warnings.push(
        `HEAD ${sha.slice(0, 12)} is not on any remote branch yet and has no pushed ancestor. ` +
          '`uv sync` in the scaffolded agent fetches the kit from GitHub, so it will fail until ' +
          'this commit is pushed. Pass --kit-rev <sha> to pin something fetchable.',
      );
      return {rev: sha, warnings};
    }
    const kitMoved = pathsChangedBetween(checkout, pushed, sha, [KIT_SUBDIRECTORY]);
    warnings.push(
      `HEAD ${sha.slice(0, 12)} is not pushed, so a scaffold pinned to it could not install. ` +
        `Pinned ${pushed.slice(0, 12)} instead — the newest commit a remote carries. ` +
        (kitMoved
          ? `Local ${KIT_SUBDIRECTORY}/ changes after it are not in this scaffold; re-pin with ` +
            '--kit-rev once they are pushed.'
          : `${KIT_SUBDIRECTORY}/ is identical at both, so the scaffold is unaffected.`),
    );
    return {rev: pushed, warnings};
  }
  return {rev: sha, warnings};
}
