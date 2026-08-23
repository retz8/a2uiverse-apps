import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {numeric} from './numeric';

const ctx = {} as DataContext;

describe('numeric function', () => {
  it('declares its api', () => {
    expect(numeric.name).toBe('numeric');
    expect(numeric.returnType).toBe('boolean');
  });

  it('validates its args (value required, bounds optional)', () => {
    expect(numeric.schema.safeParse({value: 3, min: 1}).success).toBe(true);
    expect(numeric.schema.safeParse({value: 3}).success).toBe(true);
    expect(numeric.schema.safeParse({min: 1}).success).toBe(false);
  });

  it('coerces a numeric string rather than rejecting it', () => {
    expect(numeric.schema.parse({value: '42', min: 1})).toEqual({value: 42, min: 1});
  });

  it('checks a number against its bounds', () => {
    expect(numeric.execute({value: 5, min: 1}, ctx)).toBe(true);
    expect(numeric.execute({value: 0, min: 1}, ctx)).toBe(false);
    expect(numeric.execute({value: 5, max: 3}, ctx)).toBe(false);
    expect(numeric.execute({value: 2, min: 1, max: 3}, ctx)).toBe(true);
  });

  it('is a permissive no-op when neither bound is given', () => {
    expect(numeric.execute({value: 99}, ctx)).toBe(true);
  });
});
