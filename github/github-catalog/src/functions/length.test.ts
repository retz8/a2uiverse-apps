import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {length} from './length';

const ctx = {} as DataContext;

describe('length function', () => {
  it('declares its api', () => {
    expect(length.name).toBe('length');
    expect(length.returnType).toBe('boolean');
  });

  it('validates its args (value required, bounds optional)', () => {
    expect(length.schema.safeParse({value: 'abc', min: 1}).success).toBe(true);
    expect(length.schema.safeParse({value: 'abc', max: 5}).success).toBe(true);
    expect(length.schema.safeParse({value: 'abc'}).success).toBe(true);
    expect(length.schema.safeParse({min: 1}).success).toBe(false);
  });

  it('checks a string against its bounds', () => {
    expect(length.execute({value: 'abc', min: 2}, ctx)).toBe(true);
    expect(length.execute({value: 'a', min: 2}, ctx)).toBe(false);
    expect(length.execute({value: 'abc', max: 2}, ctx)).toBe(false);
    expect(length.execute({value: 'abc', min: 1, max: 5}, ctx)).toBe(true);
  });

  it('checks a list against its bounds', () => {
    expect(length.execute({value: ['a', 'b'], min: 2}, ctx)).toBe(true);
    expect(length.execute({value: ['a'], min: 2}, ctx)).toBe(false);
  });

  it('is a permissive no-op when neither bound is given', () => {
    // The upstream object-level refine ("must provide min or max") is deliberately not
    // reproduced — it would make the schema a ZodEffects and break the parity test's .shape read.
    // The constraint is carried in the catalog.json description instead.
    expect(length.execute({value: 'anything'}, ctx)).toBe(true);
  });
});
