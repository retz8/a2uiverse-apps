import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {or} from './or';

const ctx = {} as DataContext;

describe('or function', () => {
  it('declares its api', () => {
    expect(or.name).toBe('or');
    expect(or.returnType).toBe('boolean');
  });

  it('validates its args (values required, at least two)', () => {
    expect(or.schema.safeParse({values: [true, false]}).success).toBe(true);
    expect(or.schema.safeParse({values: [false]}).success).toBe(false);
    expect(or.schema.safeParse({}).success).toBe(false);
  });

  it('is true when at least one value is true', () => {
    expect(or.execute({values: [false, true]}, ctx)).toBe(true);
    expect(or.execute({values: [false, false]}, ctx)).toBe(false);
  });
});
