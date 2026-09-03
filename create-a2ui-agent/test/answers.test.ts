import {describe, expect, it} from 'vitest';

import {
  catalogIdUrl,
  catalogPackageName,
  normalizeRepoUrl,
  pythonIdent,
  titleCase,
  validateId,
  validatePort,
  validateRepoUrl,
} from '../src/answers.js';

describe('validateId', () => {
  it('accepts kebab-case ids', () => {
    expect(validateId('acme')).toBeUndefined();
    expect(validateId('acme-mail2')).toBeUndefined();
  });

  it('rejects anything else', () => {
    for (const bad of ['', 'Acme', 'acme_mail', '-acme', 'acme-', 'acme--mail', '1acme']) {
      expect(validateId(bad), bad).toBeDefined();
    }
  });

  it('refuses the half suffixes the scaffold adds itself', () => {
    expect(validateId('acme-catalog')).toMatch(/-catalog/);
    expect(validateId('acme-agent')).toMatch(/-agent/);
  });
});

describe('validatePort', () => {
  it('accepts an unprivileged port and rejects the rest', () => {
    expect(validatePort(11001)).toBeUndefined();
    expect(validatePort(80)).toBeDefined();
    expect(validatePort(70000)).toBeDefined();
    expect(validatePort(Number.NaN)).toBeDefined();
  });
});

describe('derivations', () => {
  it('title-cases the id', () => {
    expect(titleCase('acme-mail')).toBe('Acme Mail');
  });

  it('snake-cases the python identifier', () => {
    expect(pythonIdent('acme-mail')).toBe('acme_mail');
  });

  it('names the catalog package from the id', () => {
    expect(catalogPackageName('acme')).toBe('acme-catalog');
  });
});

describe('repository URL', () => {
  it('normalizes ssh and .git forms to bare https', () => {
    expect(normalizeRepoUrl('git@github.com:retz8/a2uiverse-apps.git')).toBe(
      'https://github.com/retz8/a2uiverse-apps',
    );
    expect(normalizeRepoUrl('https://github.com/retz8/a2uiverse-apps.git/')).toBe(
      'https://github.com/retz8/a2uiverse-apps',
    );
  });

  it('validates the normalized form', () => {
    expect(validateRepoUrl('git@github.com:o/r.git')).toBeUndefined();
    expect(validateRepoUrl('')).toBeDefined();
    expect(validateRepoUrl('not a url')).toBeDefined();
  });

  it('builds the catalog id as a repo-path URL on main', () => {
    expect(catalogIdUrl('https://github.com/o/r', 'acme/acme-catalog')).toBe(
      'https://github.com/o/r/blob/main/acme/acme-catalog/catalogs/v0.9.1/catalog.json',
    );
    // Windows separators in the directory never reach the URL.
    expect(catalogIdUrl('https://github.com/o/r', 'acme\\acme-catalog')).toContain(
      '/acme/acme-catalog/catalogs/',
    );
  });
});
