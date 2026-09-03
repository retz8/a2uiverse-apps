/** Thin git queries: every answer is a string or undefined, never a thrown error. */
import {spawnSync} from 'node:child_process';

export function git(args: string[], cwd: string): string | undefined {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status !== 0) return undefined;
  return result.stdout.trim();
}

export function headSha(cwd: string): string | undefined {
  return git(['rev-parse', 'HEAD'], cwd) || undefined;
}

export function repoToplevel(cwd: string): string | undefined {
  return git(['rev-parse', '--show-toplevel'], cwd) || undefined;
}

/** Whether any of `paths` (relative to the repo) has uncommitted changes. */
export function isDirty(cwd: string, paths: string[]): boolean {
  const status = git(['status', '--porcelain', '--', ...paths], cwd);
  return status === undefined ? false : status.length > 0;
}

/** Whether `sha` is reachable from some remote-tracking branch, i.e. fetchable by others. */
export function isPushed(cwd: string, sha: string): boolean {
  const branches = git(['branch', '-r', '--contains', sha], cwd);
  return branches !== undefined && branches.length > 0;
}

export function originUrl(cwd: string): string | undefined {
  return git(['remote', 'get-url', 'origin'], cwd) || undefined;
}
