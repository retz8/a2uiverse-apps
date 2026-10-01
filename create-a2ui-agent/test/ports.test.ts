import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';

import {FIRST_AGENT_PORT} from '../src/answers.js';
import {suggestPort} from '../src/ports.js';

const dirs: string[] = [];

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'create-a2ui-agent-ports-'));
  dirs.push(root);
  return root;
}

function app(root: string, id: string, config: string): void {
  const dir = join(root, id, 'agent', 'app');
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, 'config.py'), config);
}

const config = (port: number) =>
  `CONFIG = AgentAppConfig(\n    name="x",\n    default_port=${port},\n)\n`;

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, {recursive: true, force: true});
});

describe('suggestPort', () => {
  it('suggests one above the highest default_port among the sibling agents', () => {
    const root = workspace();
    app(root, 'github', config(11001));
    app(root, 'linear', config(11005));
    app(root, 'gmail', config(11002));
    expect(suggestPort([root])).toBe(11006);
  });

  it('suggests the first port when no sibling is an app', () => {
    const root = workspace();
    mkdirSync(join(root, 'agent-kit'));
    writeFileSync(join(root, 'README.md'), '');
    expect(suggestPort([root])).toBe(FIRST_AGENT_PORT);
    expect(suggestPort([join(root, 'missing')])).toBe(FIRST_AGENT_PORT);
  });

  it('reads every directory it is given', () => {
    const here = workspace();
    const parent = workspace();
    app(here, 'github', config(11001));
    app(parent, 'linear', config(11005));
    expect(suggestPort([here, parent])).toBe(11006);
  });

  it('ignores a config without a default_port and ports below the first', () => {
    const root = workspace();
    app(root, 'github', config(11001));
    app(root, 'odd', 'CONFIG = AgentAppConfig(name="x")\n');
    app(root, 'low', config(8080));
    expect(suggestPort([root])).toBe(11002);
  });
});
