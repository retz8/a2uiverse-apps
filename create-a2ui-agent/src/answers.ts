/**
 * The scaffold's inputs and the values derived from them.
 *
 * Eight inputs are asked (task-3.4 decision 7); everything else — the catalog package name,
 * the Python identifier, the catalog id URL — derives from them here, so the walkthrough, the
 * flags, and the tests share one definition of what a valid answer set is.
 */

export type CatalogKind = 'basic' | 'custom';

export interface ScaffoldAnswers {
  /** kebab-case app id: the folder name, the catalog package prefix, the manifest id. */
  id: string;
  /** The product name as the card and the catalog title show it. */
  displayName: string;
  /** One line for the agent card. */
  description: string;
  /** The agent's port, one per app regardless of run mode. */
  port: number;
  catalogKind: CatalogKind;
  /** Wire the kit's opt-in Google ADC credential block into the MCP module. */
  googleAdc: boolean;
  /** Emit the kit's paintMeta shell convention (paint titles, question markers). */
  ecosystemReady: boolean;
  /** The repository the app lives in; the catalog id URL points into it. */
  repoUrl: string;
}

export type PartialAnswers = Partial<ScaffoldAnswers>;

export const CATALOG_KINDS: readonly CatalogKind[] = ['basic', 'custom'];

export const ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Ports the in-repo apps use start here; a fresh workspace suggests the first one. */
export const FIRST_AGENT_PORT = 11001;

export function validateId(id: string): string | undefined {
  if (!id) return 'An app id is required.';
  if (!ID_PATTERN.test(id)) {
    return 'Use kebab-case: lowercase letters and digits, words joined by single hyphens (e.g. acme-mail).';
  }
  if (id.endsWith('-catalog') || id.endsWith('-agent')) {
    return 'Leave off "-catalog" / "-agent": the halves are named from the id.';
  }
  return undefined;
}

export function validatePort(port: number): string | undefined {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    return 'The port must be an integer between 1024 and 65535.';
  }
  return undefined;
}

export function validateRepoUrl(url: string): string | undefined {
  if (!url) return 'A repository URL is required: the catalog id is a URL into it.';
  if (!/^https?:\/\/\S+\/\S+/.test(normalizeRepoUrl(url))) {
    return 'Give an https URL (or a git@host:owner/repo form) naming the repository.';
  }
  return undefined;
}

/** `acme-mail` → `Acme Mail`. */
export function titleCase(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/** `acme-mail` → `acme_mail`: the ADK app/agent name segment. */
export function pythonIdent(id: string): string {
  return id.replaceAll('-', '_');
}

export function catalogPackageName(id: string): string {
  return `${id}-catalog`;
}

/**
 * Normalizes what a git remote or a person gives — `git@github.com:o/r.git`,
 * `https://github.com/o/r.git`, a trailing slash — to the bare https form the catalog id
 * and the package's repository field use.
 */
export function normalizeRepoUrl(url: string): string {
  let out = url.trim();
  const ssh = /^(?:ssh:\/\/)?git@([^:/]+)[:/](.+)$/.exec(out);
  if (ssh) out = `https://${ssh[1]}/${ssh[2]}`;
  out = out
    .replace(/\/+$/, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
  return out;
}

/**
 * The catalog's identity URL: the repo-path URL of its catalog.json on `main`, the same
 * convention the in-repo catalogs follow. `repoDirectory` is the catalog package's path from
 * the repository root (e.g. `acme-mail/acme-mail-catalog`).
 */
export function catalogIdUrl(repoUrl: string, repoDirectory: string): string {
  const directory = repoDirectory
    .split(/[\\/]+/)
    .filter(Boolean)
    .join('/');
  return `${normalizeRepoUrl(repoUrl)}/blob/main/${directory}/catalogs/v0.9.1/catalog.json`;
}

export function defaultDescription(displayName: string): string {
  return `Answers requests about ${displayName} with A2UI surfaces.`;
}
