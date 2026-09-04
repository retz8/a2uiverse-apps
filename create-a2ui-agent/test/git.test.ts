/**
 * The pushed-ancestor queries behind the kit pin. A scaffold pinned to a commit no remote
 * carries cannot install at all, so these decide what a default pin falls back to.
 */
import {execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';

import {headSha, lastPushedAncestor, pathsChangedBetween} from '../src/git.js';

const dirs: string[] = [];
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, {cwd, encoding: 'utf8'}).trim();

/** A repo with one pushed commit, then `unpushed` further commits that no remote carries. */
function repoWithRemote(unpushed: {path: string; body: string}[]) {
  const root = mkdtempSync(join(tmpdir(), 'kitpin-'));
  dirs.push(root);
  const work = join(root, 'work');
  const bare = join(root, 'remote.git');
  mkdirSync(work);
  git(root, 'init', '--bare', '--initial-branch=main', bare);
  git(root, 'init', '--initial-branch=main', work);
  git(work, 'config', 'user.email', 'test@example.com');
  git(work, 'config', 'user.name', 'Test');

  mkdirSync(join(work, 'agent-kit'));
  writeFileSync(join(work, 'agent-kit', 'pyproject.toml'), 'seed\n');
  git(work, 'add', '-A');
  git(work, 'commit', '-m', 'seed');
  git(work, 'remote', 'add', 'origin', bare);
  git(work, 'push', '-q', 'origin', 'main');
  const pushed = headSha(work)!;

  for (const [i, {path, body}] of unpushed.entries()) {
    const full = join(work, path);
    mkdirSync(join(full, '..'), {recursive: true});
    writeFileSync(full, body);
    git(work, 'add', '-A');
    git(work, 'commit', '-m', `local ${i}`);
  }
  return {work, pushed, head: headSha(work)!};
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, {recursive: true, force: true});
});

describe('lastPushedAncestor', () => {
  it('is HEAD when HEAD is already on a remote', () => {
    const {work, head} = repoWithRemote([]);
    expect(lastPushedAncestor(work)).toBe(head);
  });

  it('is the newest pushed commit when local commits sit on top', () => {
    const {work, pushed, head} = repoWithRemote([
      {path: 'README.md', body: 'one\n'},
      {path: 'README.md', body: 'two\n'},
    ]);
    expect(head).not.toBe(pushed);
    expect(lastPushedAncestor(work)).toBe(pushed);
  });

  it('is undefined outside a repository', () => {
    const loose = mkdtempSync(join(tmpdir(), 'kitpin-loose-'));
    dirs.push(loose);
    expect(lastPushedAncestor(loose)).toBeUndefined();
  });
});

describe('pathsChangedBetween', () => {
  it('is false when the unpushed commits left the kit alone', () => {
    const {work, pushed, head} = repoWithRemote([{path: 'README.md', body: 'docs only\n'}]);
    expect(pathsChangedBetween(work, pushed, head, ['agent-kit'])).toBe(false);
  });

  it('is true when they touched it', () => {
    const {work, pushed, head} = repoWithRemote([
      {path: 'agent-kit/pyproject.toml', body: 'changed\n'},
    ]);
    expect(pathsChangedBetween(work, pushed, head, ['agent-kit'])).toBe(true);
  });
});
