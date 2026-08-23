import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {z} from 'zod';
import {BASIC_FUNCTION_APIS} from '@a2ui/web_core/v0_9';
import {BASIC_FUNCTION_NAMES, COMPONENTS, FUNCTIONS} from './catalog.registry.js';

type JsonProp = {const?: string; enum?: string[]};
type JsonComponent = {properties: Record<string, JsonProp>; required: string[]};
type JsonFunction = {
  properties: {
    call: {const?: string};
    args: {properties: Record<string, unknown>; required?: string[]};
    returnType: {const?: string};
  };
};

const catalog = JSON.parse(
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../catalogs/v0.9.1/catalog.json'),
    'utf8',
  ),
) as {
  components: Record<string, JsonComponent>;
  functions: Record<string, JsonFunction>;
  $defs: {anyComponent: {oneOf: {$ref: string}[]}; anyFunction: {oneOf: {$ref: string}[]}};
};

// Envelope fields the framework owns; present in catalog.json but never in the props-only zod schema.
const ENVELOPE_FIELDS = ['component', 'id'];

function unwrap(field: z.ZodTypeAny): z.ZodTypeAny {
  let f = field;
  while (f instanceof z.ZodOptional || f instanceof z.ZodDefault) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    f = f instanceof z.ZodOptional ? f.unwrap() : (f._def as any).innerType;
  }
  return f;
}

function enumValues(field: z.ZodTypeAny): string[] | null {
  const f = unwrap(field);
  return f instanceof z.ZodEnum ? [...f.options] : null;
}

function refName(ref: string): string {
  return ref.split('/').pop() as string;
}

// Returns the zod object's top-level .shape. For a component Api this is the props object;
// for a function implementation, `.schema` IS the args object schema, so .shape yields the arg names.
function shapeOf(api: {schema: z.ZodTypeAny}): Record<string, z.ZodTypeAny> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (api.schema as z.ZodObject<any>).shape as Record<string, z.ZodTypeAny>;
}

// Whether an arg is DECLARED optional, read syntactically rather than probed semantically.
// `.isOptional()` asks "does this accept undefined", which coercion silently defeats — notably
// `z.coerce.string().isOptional()` is true, because String(undefined) parses fine. That would
// misreport required args as optional across the adopted basic-catalog functions. The declaration
// itself cannot be fooled: an arg is optional iff it was written `.optional()` or `.default(...)`.
function isDeclaredOptional(field: z.ZodTypeAny): boolean {
  return field instanceof z.ZodOptional || field instanceof z.ZodDefault;
}

describe.each(Object.entries(COMPONENTS))(
  'component %s: zod ↔ catalog.json parity',
  (name, api) => {
    const jsonComponent = catalog.components[name];
    const zodShape = shapeOf(api);

    it('is declared in catalog.json', () => {
      expect(jsonComponent, `catalog.json is missing component ${name}`).toBeDefined();
    });

    it('property-name sets match (excluding envelope fields)', () => {
      const jsonNames = Object.keys(jsonComponent.properties)
        .filter(k => !ENVELOPE_FIELDS.includes(k))
        .sort();
      expect(jsonNames).toEqual(Object.keys(zodShape).sort());
    });

    it('required sets match (excluding envelope fields)', () => {
      const jsonRequired = jsonComponent.required.filter(k => !ENVELOPE_FIELDS.includes(k)).sort();
      const zodRequired = Object.entries(zodShape)
        .filter(([, v]) => !v.isOptional())
        .map(([k]) => k)
        .sort();
      expect(jsonRequired).toEqual(zodRequired);
    });

    it('enum value sets match per enum prop', () => {
      for (const [key, field] of Object.entries(zodShape)) {
        const zodEnum = enumValues(field);
        if (!zodEnum) continue; // non-enum props ($ref/Dynamic/plain) — tolerated, not compared
        const jsonEnum = jsonComponent.properties[key]?.enum ?? [];
        expect([...jsonEnum].sort(), `enum for ${name}.${key}`).toEqual([...zodEnum].sort());
      }
    });

    it('component discriminator const equals the component key', () => {
      expect(jsonComponent.properties.component?.const).toBe(name);
    });
  },
);

describe('anyComponent oneOf covers exactly the declared components', () => {
  it('matches the components map', () => {
    const refNames = catalog.$defs.anyComponent.oneOf.map(r => refName(r.$ref)).sort();
    expect(refNames).toEqual(Object.keys(catalog.components).sort());
  });
});

describe.each(Object.entries(FUNCTIONS))('function %s: zod ↔ catalog.json parity', (name, fn) => {
  const jsonFn = catalog.functions[name];

  it('is declared in functions and anyFunction', () => {
    expect(Object.keys(catalog.functions)).toContain(name);
    const refNames = catalog.$defs.anyFunction.oneOf.map(r => refName(r.$ref));
    expect(refNames).toContain(name);
  });

  it('arg-name sets match', () => {
    const zodArgs = Object.keys(shapeOf(fn)).sort();
    const jsonArgs = Object.keys(jsonFn.properties.args.properties).sort();
    expect(jsonArgs).toEqual(zodArgs);
  });

  it('args required-ness matches', () => {
    const zodRequired = Object.entries(shapeOf(fn))
      .filter(([, v]) => !isDeclaredOptional(v))
      .map(([k]) => k)
      .sort();
    const jsonRequired = [...(jsonFn.properties.args.required ?? [])].sort();
    expect(jsonRequired).toEqual(zodRequired);
  });

  it('call discriminator const equals the function key', () => {
    expect(jsonFn.properties.call?.const).toBe(name);
  });

  it('returnType const matches the zod returnType', () => {
    expect(jsonFn.properties.returnType?.const).toBe(fn.returnType);
  });
});

describe('anyFunction oneOf covers exactly the declared functions', () => {
  it('matches the functions map', () => {
    const refNames = catalog.$defs.anyFunction.oneOf.map(r => refName(r.$ref)).sort();
    expect(refNames).toEqual(Object.keys(catalog.functions).sort());
  });
});

// Drift guard for the adopted basic-catalog functions (task 7.9). Their args schemas are authored
// here rather than re-exported, which is what keeps the parity assertions above strict — but it
// also means an upstream arg change would otherwise surface as a runtime arg mismatch instead of a
// test failure. This pins our arg names against @a2ui/web_core's own declarations.
describe('adopted basic-catalog functions track @a2ui/web_core', () => {
  // Upstream wraps `length` and `numeric` in an object-level .refine(), making those schemas a
  // ZodEffects rather than a ZodObject. Peel the effects off to reach the underlying shape.
  function upstreamShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
    let s = schema;
    while (s instanceof z.ZodEffects) s = s.innerType();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (s as z.ZodObject<any>).shape as Record<string, z.ZodTypeAny>;
  }

  const upstream = new Map(BASIC_FUNCTION_APIS.map(api => [api.name, api]));

  it.each(BASIC_FUNCTION_NAMES)('%s: arg names match the upstream api', name => {
    const api = upstream.get(name);
    expect(api, `@a2ui/web_core no longer declares ${name}`).toBeDefined();
    const ours = Object.keys(shapeOf(FUNCTIONS[name])).sort();
    const theirs = Object.keys(upstreamShape(api!.schema)).sort();
    expect(ours).toEqual(theirs);
  });

  it('adopts every function the basic catalog declares', () => {
    // BASIC_FUNCTION_APIS also carries the 11 operators the basic catalog does not declare as
    // functions (add, equals, contains, …); those stay unadopted until a flow binds one, so the
    // adopted set is compared against the published basic catalog.json, not the upstream module.
    // A failure here means upstream changed its declared set — adopt the addition or record why not.
    const basicCatalogPath = resolve(
      dirname(createRequire(import.meta.url).resolve('@a2ui/web_core/v0_9')),
      'schemas/catalogs/basic/catalog.json',
    );
    const declared = JSON.parse(readFileSync(basicCatalogPath, 'utf8')) as {
      functions: Record<string, unknown>;
    };
    expect([...BASIC_FUNCTION_NAMES].sort()).toEqual(Object.keys(declared.functions).sort());
  });
});
