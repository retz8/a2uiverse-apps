/** The catalog's two faces stay in lockstep: catalog.json ↔ runtime CATALOG. */
import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';
import {CATALOG} from './catalog';
import {CATALOG_ID} from './catalog-id';

// Path from the package root (vitest's cwd); import.meta.url is http-scheme under jsdom.
const schema = JSON.parse(readFileSync('catalogs/v0.9.1/catalog.json', 'utf8')) as {
  $id: string;
  catalogId: string;
  components: Record<string, unknown>;
  functions: Record<string, unknown>;
};

/**
 * This assertion is also the upstream-drift detector: the runtime catalog is built from the
 * pinned `@a2ui/react`'s basic catalog, while the schema is a checked-in copy of upstream's.
 * A mismatch almost always means the pin moved and `catalogs/v0.9.1/catalog.json` needs
 * refreshing from `specification/v0_9/catalogs/basic/catalog.json` on the `upstream/main` ref
 * — not that a component was forgotten here.
 */
const DRIFT_HINT =
  'component sets differ: the pinned @a2ui/react basic catalog and the checked-in ' +
  'catalog.json disagree. Refresh catalog.json from upstream and re-apply the identity ' +
  'fields ($id, catalogId, title, description).';

test('catalog id matches the schema', () => {
  expect(CATALOG.id).toBe(CATALOG_ID);
  expect(schema.$id).toBe(CATALOG_ID);
  expect(schema.catalogId).toBe(CATALOG_ID);
});

test('every schema component has an implementation and vice versa', () => {
  expect([...CATALOG.components.keys()].sort(), DRIFT_HINT).toEqual(
    Object.keys(schema.components).sort(),
  );
});

test('every schema function has an implementation', () => {
  // Subset, not equality: the upstream implementation ships arithmetic beyond its own
  // v0_9_1 schema (SPEC §14). Those stay undeclared until derived bindings need them (M2).
  const implemented = new Set(CATALOG.functions.keys());
  for (const name of Object.keys(schema.functions)) {
    expect(implemented.has(name), `function ${name} declared but not implemented`).toBe(true);
  }
});

test('the bundle contributes no component mapping of its own', () => {
  // Gmail's product identity is the Provider's token theme. A component here that the basic
  // catalog does not declare means the bundle has started growing a component library.
  expect(CATALOG.components.has('Slot')).toBe(false);
  expect(CATALOG.components.has('Attribution')).toBe(false);
});
