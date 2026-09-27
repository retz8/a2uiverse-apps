/** The catalog's two faces stay in lockstep: `catalog.json` ↔ the zod schemas and the runtime CATALOG. */
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {CATALOG} from './catalog';
import {CATALOG_ID} from './catalog-id';
import {COMPONENT_APIS} from './components';

type JsonComponent = {
  description: string;
  properties: Record<string, {const?: string; enum?: string[]; description?: string}>;
  required: string[];
};

// Path from the package root (vitest's cwd); import.meta.url is http-scheme under jsdom.
const catalog = JSON.parse(readFileSync('catalogs/v0.9.1/catalog.json', 'utf8')) as {
  $id: string;
  catalogId: string;
  components: Record<string, JsonComponent>;
  functions: Record<string, unknown>;
  $defs: {anyComponent: {oneOf: {$ref: string}[]}; anyFunction: {oneOf: {$ref: string}[]}};
};

const refName = (ref: string) => ref.split('/').pop() as string;

function unwrap(field: z.ZodTypeAny): z.ZodTypeAny {
  return field instanceof z.ZodOptional ? unwrap(field.unwrap()) : field;
}

describe('the catalog', () => {
  it('carries one id on both faces', () => {
    expect(CATALOG.id).toBe(CATALOG_ID);
    expect(catalog.$id).toBe(CATALOG_ID);
    expect(catalog.catalogId).toBe(CATALOG_ID);
  });

  it('registers exactly the declared components', () => {
    expect([...CATALOG.components.keys()].sort()).toEqual(Object.keys(catalog.components).sort());
    expect(Object.keys(COMPONENT_APIS).sort()).toEqual(Object.keys(catalog.components).sort());
  });

  it('anyComponent and anyFunction cover exactly what is declared', () => {
    expect(catalog.$defs.anyComponent.oneOf.map(r => refName(r.$ref)).sort()).toEqual(
      Object.keys(catalog.components).sort(),
    );
    expect(catalog.$defs.anyFunction.oneOf.map(r => refName(r.$ref)).sort()).toEqual(
      Object.keys(catalog.functions).sort(),
    );
  });
});

describe.each(Object.entries(COMPONENT_APIS))('component %s: zod ↔ catalog.json', (name, api) => {
  const json = catalog.components[name];
  const shape = (api.schema as z.ZodObject<z.ZodRawShape>).shape;

  it('declares the same props', () => {
    const declared = Object.keys(json.properties).filter(k => k !== 'component');
    expect(declared.sort()).toEqual(Object.keys(shape).sort());
  });

  it('requires the same props', () => {
    const required = json.required.filter(k => k !== 'component').sort();
    const zodRequired = Object.entries(shape)
      .filter(([, field]) => !field.isOptional())
      .map(([key]) => key)
      .sort();
    expect(required).toEqual(zodRequired);
  });

  it('allows the same enum values', () => {
    for (const [key, field] of Object.entries(shape)) {
      const inner = unwrap(field);
      if (!(inner instanceof z.ZodEnum)) continue;
      expect(json.properties[key].enum, `${name}.${key}`).toEqual([...inner.options]);
    }
  });

  it('names itself in its component const', () => {
    expect(json.properties.component.const).toBe(name);
  });

  it('describes itself and every prop for the agent, naming no library', () => {
    const props = Object.entries(json.properties).filter(([key]) => key !== 'component');
    const prose = [json.description, ...props.map(([, prop]) => prop.description)];
    for (const text of prose) {
      expect(text, `${name}: a description is missing`).toBeTruthy();
      expect(text).not.toMatch(/radix|react|inter\b/i);
    }
  });
});

describe('functions', () => {
  it('are the basic catalog’s, declared as the pinned runtime declares them', () => {
    // A mismatch means the @a2ui/web_core pin moved: copy its basic catalog's functions again.
    const basicPath = resolve(
      dirname(createRequire(resolve('package.json')).resolve('@a2ui/web_core/v0_9')),
      'schemas/catalogs/basic/catalog.json',
    );
    const basic = JSON.parse(readFileSync(basicPath, 'utf8')) as {functions: unknown};
    expect(catalog.functions).toEqual(basic.functions);
  });

  it('are each implemented', () => {
    // Subset, not equality: the runtime ships operators its own schema does not declare.
    for (const name of Object.keys(catalog.functions)) {
      expect(CATALOG.functions.has(name), `${name} declared but not implemented`).toBe(true);
    }
  });
});
