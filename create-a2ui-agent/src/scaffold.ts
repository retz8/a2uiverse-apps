/**
 * Writes one app folder from a complete answer set: agent half, catalog half, manifest.
 *
 * Layout mirrors the in-repo apps — `<dir>/agent/`, `<dir>/<id>-catalog/`,
 * `<dir>/manifest.json` — so a scaffold inside the apps repo is launchable by existing and one
 * outside it is the same shape a vendor already knows from the roster.
 */
import {existsSync, mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';

import {catalogIdUrl, catalogPackageName, pythonIdent, type ScaffoldAnswers} from './answers.js';
import {agentConfigPy, agentMcpPy, agentPyproject, manifestJson} from './generate.js';
import {templatesDir} from './kit.js';
import {copyTemplateTree, type Tokens} from './templates.js';

export interface ScaffoldOptions {
  answers: ScaffoldAnswers;
  /** The app folder to create. */
  targetDir: string;
  /** The catalog package's path from the repository root, for the catalog id URL. */
  repoDirectory: string;
  /** The kit commit the agent pins. */
  kitRev: string;
}

export interface ScaffoldResult {
  targetDir: string;
  catalogId: string;
  /** Written paths, relative to `targetDir`, sorted. */
  files: string[];
}

export function tokensFor(a: ScaffoldAnswers, catalogId: string, repoDirectory: string): Tokens {
  return {
    APP_ID: a.id,
    PACKAGE_NAME: catalogPackageName(a.id),
    DISPLAY_NAME: a.displayName,
    DESCRIPTION: a.description,
    PORT: String(a.port),
    CATALOG_ID: catalogId,
    REPO_URL: a.repoUrl,
    REPO_DIRECTORY: repoDirectory,
    PY_IDENT: pythonIdent(a.id),
  };
}

export function scaffold({
  answers,
  targetDir,
  repoDirectory,
  kitRev,
}: ScaffoldOptions): ScaffoldResult {
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    throw new Error(`${targetDir} exists and is not empty; pick another directory.`);
  }
  const catalogId = catalogIdUrl(answers.repoUrl, repoDirectory);
  const tokens = tokensFor(answers, catalogId, repoDirectory);
  const templates = templatesDir();
  const agentDir = join(targetDir, 'agent');
  const catalogDir = join(targetDir, catalogPackageName(answers.id));

  const files = new Set<string>();
  const record = (dir: string, written: string[]) => {
    for (const path of written) files.add(relative(targetDir, join(dir, path)));
  };

  // Agent half: the common tree, refined by the kind overlay and the ADC overlay.
  record(agentDir, copyTemplateTree(join(templates, 'agent'), agentDir, tokens));
  record(
    agentDir,
    copyTemplateTree(join(templates, 'agent-kind', answers.catalogKind), agentDir, tokens),
  );
  if (answers.googleAdc) {
    record(agentDir, copyTemplateTree(join(templates, 'agent-google-adc'), agentDir, tokens));
  }
  const generated: Record<string, string> = {
    'agent/pyproject.toml': agentPyproject(answers, kitRev),
    'agent/app/config.py': agentConfigPy(answers),
    'agent/app/mcp.py': agentMcpPy(answers),
    'manifest.json': manifestJson(answers, catalogId),
  };
  for (const [path, content] of Object.entries(generated)) {
    const full = join(targetDir, path);
    mkdirSync(join(full, '..'), {recursive: true});
    writeFileSync(full, content);
    files.add(path);
  }

  // Catalog half: the whole package for the chosen kind.
  record(
    catalogDir,
    copyTemplateTree(join(templates, 'catalog', answers.catalogKind), catalogDir, tokens),
  );

  return {targetDir, catalogId, files: [...files].sort()};
}
