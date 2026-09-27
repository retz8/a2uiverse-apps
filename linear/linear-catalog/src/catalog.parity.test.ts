/** The catalog's two faces stay in lockstep: catalogs/v0.9.1/catalog.json ↔ the zod schemas. */
import {readFileSync} from 'node:fs';
import {describe, expect, it, test} from 'vitest';
import {z} from 'zod';
import {CATALOG, COMPONENT_APIS} from './catalog';
import {CATALOG_ID} from './catalog-id';

type JsonProp = {enum?: string[]; $ref?: string; type?: string};
type JsonComponent = {properties: Record<string, JsonProp>; required: string[]};

// Path from the package root (vitest's cwd); import.meta.url is http-scheme under jsdom.
const schema = JSON.parse(readFileSync('catalogs/v0.9.1/catalog.json', 'utf8')) as {
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

const shapeOf = (api: {schema: z.ZodTypeAny}) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (api.schema as z.ZodObject<any>).shape as Record<string, z.ZodTypeAny>;

test('catalog id matches the schema', () => {
  expect(CATALOG.id).toBe(CATALOG_ID);
  expect(schema.$id).toBe(CATALOG_ID);
  expect(schema.catalogId).toBe(CATALOG_ID);
});

test('the schema, the runtime catalog and the zod schemas name the same components', () => {
  const declared = Object.keys(schema.components).sort();
  expect([...CATALOG.components.keys()].sort()).toEqual(declared);
  expect(Object.keys(COMPONENT_APIS).sort()).toEqual(declared);
});

test('anyComponent covers exactly the declared components', () => {
  expect(schema.$defs.anyComponent.oneOf.map(r => refName(r.$ref)).sort()).toEqual(
    Object.keys(schema.components).sort(),
  );
});

describe.each(Object.entries(COMPONENT_APIS))('%s: zod ↔ catalog.json', (name, api) => {
  const json = schema.components[name];
  const shape = shapeOf(api);

  it('names itself in its discriminator', () => {
    expect((json.properties.component as {const?: string}).const).toBe(name);
  });

  it('declares the same properties', () => {
    const props = Object.keys(json.properties).filter(key => key !== 'component');
    expect(props.sort()).toEqual(Object.keys(shape).sort());
  });

  it('requires the same properties', () => {
    const required = json.required.filter(key => key !== 'component').sort();
    const zodRequired = Object.entries(shape)
      .filter(([, field]) => !field.isOptional())
      .map(([key]) => key)
      .sort();
    expect(required).toEqual(zodRequired);
  });

  it('offers the same values for each enum', () => {
    for (const [key, field] of Object.entries(shape)) {
      const inner = unwrap(field);
      if (!(inner instanceof z.ZodEnum)) continue;
      expect([...(json.properties[key].enum ?? [])].sort(), `${name}.${key}`).toEqual(
        [...inner.options].sort(),
      );
    }
  });

  it('marks a bound prop with a common type and a fixed one with a plain type', () => {
    for (const [key, field] of Object.entries(shape)) {
      const inner = unwrap(field);
      const plain = inner instanceof z.ZodEnum || inner instanceof z.ZodBoolean;
      const prop = json.properties[key];
      expect(plain ? prop.type : prop.$ref, `${name}.${key}`).toBeTruthy();
    }
  });
});

test('every declared function has an implementation', () => {
  // Subset, not equality: the upstream implementation ships arithmetic beyond its own schema.
  const implemented = new Set(CATALOG.functions.keys());
  for (const name of Object.keys(schema.functions)) {
    expect(implemented.has(name), `function ${name} declared but not implemented`).toBe(true);
  }
  expect(schema.$defs.anyFunction.oneOf.map(r => refName(r.$ref)).sort()).toEqual(
    Object.keys(schema.functions).sort(),
  );
});
