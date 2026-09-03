/**
 * The install step: `uv sync` for the agent, `pnpm install` for the catalog. Inside a pnpm
 * workspace the catalog is a member and the install runs at the workspace root; outside,
 * it runs in the catalog package itself.
 */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';

export interface InstallStep {
  label: string;
  command: string;
  args: string[];
  cwd: string;
}

export function workspaceRoot(from: string): string | undefined {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function installSteps(targetDir: string, catalogPackage: string): InstallStep[] {
  const catalogDir = join(targetDir, catalogPackage);
  const root = workspaceRoot(catalogDir);
  return [
    {label: 'agent: uv sync', command: 'uv', args: ['sync'], cwd: join(targetDir, 'agent')},
    root
      ? {label: 'catalog: pnpm install (workspace)', command: 'pnpm', args: ['install'], cwd: root}
      : {label: 'catalog: pnpm install', command: 'pnpm', args: ['install'], cwd: catalogDir},
  ];
}

/** One line naming the command and where it runs, relative to `from` when given. */
export function describe(step: InstallStep, from?: string): string {
  const where = from ? relative(from, step.cwd) || '.' : step.cwd;
  return `${step.command} ${step.args.join(' ')}  (in ${where})`;
}

/** Runs one step, returning its combined output on failure. */
export function runStep(step: InstallStep): {ok: boolean; output: string} {
  const result = spawnSync(step.command, step.args, {
    cwd: step.cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.error) return {ok: false, output: `${result.error.message}\n${output}`};
  return {ok: result.status === 0, output};
}
