/**
 * The CLI–kit drift gate (task-3.4 decision 13): scaffold each kind, then run the generated
 * app's own gates — the agent's pytest against the working-tree kit, and the catalog's
 * typecheck and tests — so a kit change that breaks the templates fails `pnpm verify`.
 *
 * The scaffolded agent pins the kit by git sha; here, and only here, that source is rewritten
 * to a path dependency on the sibling `agent-kit/`, because the gate has to run against what
 * is on disk, not what is pushed.
 */
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {afterAll, describe, expect, it} from 'vitest';

import type {CatalogKind, ScaffoldAnswers} from '../src/answers.js';
import {KIT_PACKAGE, kitCheckout} from '../src/kit.js';
import {scaffold} from '../src/scaffold.js';

const TEN_MINUTES = 10 * 60 * 1000;

function have(command: string): boolean {
  return spawnSync(command, ['--version'], {stdio: 'ignore'}).status === 0;
}

const checkout = kitCheckout();
const toolsPresent = have('uv') && have('pnpm');
const gate = checkout && toolsPresent ? describe : describe.skip;

function sh(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {cwd, encoding: 'utf8', env: {...process.env, CI: '1'}});
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed in ${cwd} (exit ${result.status})\n` +
        `${result.stdout}\n${result.stderr}`,
    );
  }
}

const roots: string[] = [];
// Removing two installed trees (a .venv and a node_modules) can outlast vitest's 10s hook
// default when the machine is busy with the other packages' suites.
afterAll(() => {
  for (const dir of roots.splice(0)) rmSync(dir, {recursive: true, force: true});
}, 120_000);

function scaffoldKind(kind: CatalogKind): string {
  const root = mkdtempSync(join(tmpdir(), `create-a2ui-agent-run-${kind}-`));
  roots.push(root);
  const answers: ScaffoldAnswers = {
    id: `probe-${kind}`,
    displayName: `Probe ${kind}`,
    description: `A scaffold probe on the ${kind} catalog.`,
    port: 11999,
    catalogKind: kind,
    googleAdc: kind === 'basic',
    ecosystemReady: true,
    repoUrl: 'https://github.com/example/apps',
  };
  const targetDir = join(root, answers.id);
  scaffold({
    answers,
    targetDir,
    repoDirectory: `${answers.id}/${answers.id}-catalog`,
    kitRev: 'unused',
  });

  // Point the pin at the working-tree kit for this run only.
  const pyproject = join(targetDir, 'agent', 'pyproject.toml');
  const kitPath = resolve(checkout!, 'agent-kit');
  const rewritten = readFileSync(pyproject, 'utf8').replace(
    new RegExp(`^${KIT_PACKAGE} = \\{ git = .*$`, 'm'),
    `${KIT_PACKAGE} = { path = "${kitPath}", editable = true }`,
  );
  expect(rewritten).toContain(`path = "${kitPath}"`);
  writeFileSync(pyproject, rewritten);
  return targetDir;
}

gate('a fresh scaffold passes its own gates against the working-tree kit', () => {
  it.each(['basic', 'custom'] as const)(
    '%s: agent pytest, catalog typecheck and tests',
    kind => {
      const targetDir = scaffoldKind(kind);
      const agentDir = join(targetDir, 'agent');
      sh('uv', ['sync', '--quiet'], agentDir);
      sh('uv', ['run', '--quiet', 'pytest', '-q'], agentDir);

      const catalogDir = join(targetDir, `probe-${kind}-catalog`);
      sh('pnpm', ['install', '--ignore-workspace', '--silent'], catalogDir);
      sh('pnpm', ['typecheck'], catalogDir);
      sh('pnpm', ['test', '--silent'], catalogDir);
    },
    TEN_MINUTES,
  );
});

if (!checkout || !toolsPresent) {
  it('drift gate skipped', () => {
    console.warn(
      'scaffold-run gate skipped: ' +
        (checkout ? 'uv and pnpm are required on PATH' : 'not running from the apps checkout'),
    );
  });
}
