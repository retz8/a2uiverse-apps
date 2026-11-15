#!/usr/bin/env node
/**
 * Run every agent's own tests, one after another: `uv run pytest` in the agent kit and in each
 * Python agent, `go test ./...` in each Go agent. An agent is the `agent/` folder of an app,
 * `<app>/agent/` or `mocks/<app>/agent/`, so an app the scaffolder adds is run with no change here.
 *
 *   pnpm test:agents
 *
 * Exits non-zero when any suite fails, naming each one that did.
 */
import {spawnSync} from 'node:child_process';
import {existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** The agent kit, then each app's agent folder, as paths from the repo root. */
function agentFolders() {
  const folders = ['agent-kit'];
  for (const parent of ['.', 'mocks']) {
    for (const entry of readdirSync(join(ROOT, parent), {withFileTypes: true})) {
      const folder = join(parent, entry.name, 'agent');
      if (entry.isDirectory() && existsSync(join(ROOT, folder))) folders.push(folder);
    }
  }
  return folders;
}

/** The command that runs a folder's tests, read from the project file it holds. */
function testCommand(folder) {
  if (existsSync(join(ROOT, folder, 'pyproject.toml'))) return ['uv', ['run', 'pytest']];
  if (existsSync(join(ROOT, folder, 'go.mod'))) return ['go', ['test', './...']];
  return null;
}

const failed = [];
for (const folder of agentFolders()) {
  const command = testCommand(folder);
  if (command == null) {
    console.error(`\n${folder}: no pyproject.toml or go.mod, so no tests to run`);
    failed.push(folder);
    continue;
  }
  const [program, args] = command;
  console.log(`\n${folder}: ${program} ${args.join(' ')}`);
  const result = spawnSync(program, args, {cwd: join(ROOT, folder), stdio: 'inherit'});
  if (result.error != null) console.error(`${folder}: ${result.error.message}`);
  if (result.status !== 0) failed.push(folder);
}

if (failed.length > 0) {
  console.error(`\nAgent tests failed in ${failed.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('\nEvery agent passed its tests');
}
