/** The catalog's two faces stay in lockstep: catalog.json ↔ the registry. */
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {CATALOG_ID} from './catalog-id';
import {COMPONENTS, FUNCTIONS} from './catalog.registry';

// Path from the package root (vitest's cwd); import.meta.url is http-scheme under jsdom.
const schema = JSON.parse(readFileSync('catalogs/v0.9.1/catalog.json', 'utf8')) as {
  $id: string;
  catalogId: string;
  components: Record<string, {properties: Record<string, unknown>; required?: string[]}>;
  functions: Record<string, unknown>;
  $defs: {anyComponent: {oneOf: {$ref: string}[]}};
};

// Envelope fields the framework owns; present in catalog.json but never in the props-only zod schema.
const ENVELOPE_FIELDS = ['component', 'id'];

describe('catalog.json ↔ registry', () => {
  it('carries the catalog id in both identity fields', () => {
    expect(schema.$id).toBe(CATALOG_ID);
    expect(schema.catalogId).toBe(CATALOG_ID);
  });

  it('declares exactly the registry components', () => {
    expect(Object.keys(schema.components).sort()).toEqual(Object.keys(COMPONENTS).sort());
  });

  it('lists every component in anyComponent', () => {
    const refs = schema.$defs.anyComponent.oneOf.map(entry =>
      entry.$ref.replace('#/components/', ''),
    );
    expect(refs.sort()).toEqual(Object.keys(schema.components).sort());
  });

  it('declares exactly the registry functions', () => {
    expect(Object.keys(schema.functions).sort()).toEqual(Object.keys(FUNCTIONS).sort());
  });

  it.each(Object.entries(COMPONENTS))('%s: schema props match the zod surface', (name, api) => {
    const declared = Object.keys(schema.components[name].properties).filter(
      key => !ENVELOPE_FIELDS.includes(key),
    );
    const zodShape = (api.schema as z.ZodObject<z.ZodRawShape>).shape;
    expect(declared.sort()).toEqual(Object.keys(zodShape).sort());
  });
});
