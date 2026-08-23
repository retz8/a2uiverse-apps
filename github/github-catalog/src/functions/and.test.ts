import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {and} from './and.js';

const ctx = {} as DataContext;

describe('and function', () => {
  it('declares its api', () => {
    expect(and.name).toBe('and');
    expect(and.returnType).toBe('boolean');
  });

  it('validates its args (values required, at least two)', () => {
    expect(and.schema.safeParse({values: [true, false]}).success).toBe(true);
    expect(and.schema.safeParse({values: [true]}).success).toBe(false);
    expect(and.schema.safeParse({}).success).toBe(false);
  });

  it('is true only when every value is true', () => {
    expect(and.execute({values: [true, true]}, ctx)).toBe(true);
    expect(and.execute({values: [true, false]}, ctx)).toBe(false);
    expect(and.execute({values: [true, true, false]}, ctx)).toBe(false);
  });
});
