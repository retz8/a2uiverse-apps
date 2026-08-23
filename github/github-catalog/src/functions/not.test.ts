import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {not} from './not.js';

const ctx = {} as DataContext;

describe('not function', () => {
  it('declares its api', () => {
    expect(not.name).toBe('not');
    expect(not.returnType).toBe('boolean');
  });

  it('validates its args (value required)', () => {
    expect(not.schema.safeParse({value: true}).success).toBe(true);
    expect(not.schema.safeParse({value: false}).success).toBe(true);
    expect(not.schema.safeParse({}).success).toBe(false);
  });

  it('inverts its value', () => {
    expect(not.execute({value: true}, ctx)).toBe(false);
    expect(not.execute({value: false}, ctx)).toBe(true);
  });

  it('inverts truthiness, which is how it negates a validator result', () => {
    expect(not.execute({value: ''}, ctx)).toBe(true);
    expect(not.execute({value: 'filled'}, ctx)).toBe(false);
  });
});
