/**
 * Snapshot tests of the generated tree: the file list per variant, and the content of the
 * three generated files. A template edit that changes what a scaffold contains shows up here
 * as a deliberate snapshot update, never as a silent change.
 */
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';

import type {ScaffoldAnswers} from '../src/answers.js';
import {scaffold} from '../src/scaffold.js';

const KIT_REV = '0123456789abcdef0123456789abcdef01234567';
const REPO_URL = 'https://github.com/example/apps';

const BASE: ScaffoldAnswers = {
  id: 'acme-mail',
  displayName: 'Acme Mail',
  description: "Reads and files the user's Acme mailbox.",
  port: 11004,
  catalogKind: 'basic',
  googleAdc: false,
  ecosystemReady: false,
  repoUrl: REPO_URL,
};

const dirs: string[] = [];

function run(overrides: Partial<ScaffoldAnswers>, {inWorkspace = false} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'create-a2ui-agent-'));
  dirs.push(root);
  if (inWorkspace)
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "*/*-catalog"\n');
  const answers = {...BASE, ...overrides};
  const targetDir = join(root, answers.id);
  const result = scaffold({
    answers,
    targetDir,
    repoDirectory: `${answers.id}/${answers.id}-catalog`,
    kitRev: KIT_REV,
  });
  const read = (path: string) => readFileSync(join(targetDir, path), 'utf8');
  return {result, read};
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, {recursive: true, force: true});
});

describe('basic kind, both opt-ins', () => {
  it('writes the expected tree and generated files', () => {
    const {result, read} = run({googleAdc: true, ecosystemReady: true});
    expect(result.catalogId).toBe(
      `${REPO_URL}/blob/main/acme-mail/acme-mail-catalog/catalogs/v0.9.1/catalog.json`,
    );
    expect(result.files).toMatchSnapshot('files');
    expect(read('agent/pyproject.toml')).toMatchSnapshot('pyproject.toml');
    expect(read('agent/app/config.py')).toMatchSnapshot('config.py');
    expect(read('agent/app/mcp.py')).toMatchSnapshot('mcp.py');
    expect(read('agent/.env.example')).toContain('GOOGLE_CLOUD_PROJECT');
  });
});

describe('custom kind, no opt-ins', () => {
  it('writes the expected tree and generated files', () => {
    const {result, read} = run({catalogKind: 'custom'});
    expect(result.files).toMatchSnapshot('files');
    expect(read('agent/app/config.py')).toMatchSnapshot('config.py');
    expect(read('agent/app/mcp.py')).toMatchSnapshot('mcp.py');
    expect(read('agent/.env.example')).toContain('VENDOR_TOKEN');
    expect(read('agent/.env.example')).not.toContain('GOOGLE_CLOUD_PROJECT');
  });
});

describe('token substitution', () => {
  it('leaves no placeholder behind and writes the catalog id into all three places', () => {
    const {result, read} = run({});
    for (const file of result.files) {
      expect(read(file), file).not.toMatch(/__[A-Z][A-Z0-9_]*__/);
    }
    const id = result.catalogId;
    expect(JSON.parse(read('acme-mail-catalog/catalogs/v0.9.1/catalog.json'))).toMatchObject({
      $id: id,
      catalogId: id,
    });
    expect(read('acme-mail-catalog/src/catalog-id.ts')).toContain(`'${id}'`);
    expect(read('agent/tests/test_catalog.py')).toContain(`"${id}"`);
  });

  it('renames the stored _gitignore to .gitignore', () => {
    const {result} = run({});
    expect(result.files).toContain('agent/.gitignore');
    expect(result.files).toContain('acme-mail-catalog/.gitignore');
    expect(result.files.some(f => f.endsWith('_gitignore'))).toBe(false);
  });

  it('refuses a non-empty target', () => {
    const {result} = run({});
    expect(() =>
      scaffold({
        answers: BASE,
        targetDir: result.targetDir,
        repoDirectory: 'acme-mail/acme-mail-catalog',
        kitRev: KIT_REV,
      }),
    ).toThrow(/not empty/);
  });
});

describe('Stellify in the catalog', () => {
  it('pins Stellify and runs its check', () => {
    const {read} = run({});
    const pkg = JSON.parse(read('acme-mail-catalog/package.json'));
    expect(pkg.devDependencies['@a2uiverse/stellify']).toMatch(
      /^github:retz8\/a2uiverse#[0-9a-f]{40}&path:packages\/stellify$/,
    );
    expect(pkg.scripts.check).toBe('stellify check');
  });

  it('makes a catalog outside any pnpm workspace its own, approving esbuild', () => {
    const {result, read} = run({});
    expect(result.files).toContain('acme-mail-catalog/pnpm-workspace.yaml');
    expect(read('acme-mail-catalog/pnpm-workspace.yaml')).toMatch(
      /allowBuilds:\n {2}esbuild: true/,
    );
  });

  it('leaves a catalog inside a workspace to the workspace', () => {
    const {result} = run({}, {inWorkspace: true});
    expect(result.files).not.toContain('acme-mail-catalog/pnpm-workspace.yaml');
    expect(existsSync(join(result.targetDir, 'acme-mail-catalog', 'pnpm-workspace.yaml'))).toBe(
      false,
    );
  });
});
