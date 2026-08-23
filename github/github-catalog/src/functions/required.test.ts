import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {required} from './required';

const ctx = {} as DataContext;

describe('required function', () => {
  it('declares its api', () => {
    expect(required.name).toBe('required');
    expect(required.returnType).toBe('boolean');
  });

  it('validates its args (value required, but of any type)', () => {
    expect(required.schema.safeParse({value: 'a'}).success).toBe(true);
    expect(required.schema.safeParse({value: 0}).success).toBe(true);
    expect(required.schema.safeParse({value: []}).success).toBe(true);
    expect(required.schema.safeParse({}).success).toBe(false);
  });

  it('is true for a present value', () => {
    expect(required.execute({value: 'title'}, ctx)).toBe(true);
    expect(required.execute({value: ['a']}, ctx)).toBe(true);
  });

  it('is false for an absent or empty value', () => {
    expect(required.execute({value: ''}, ctx)).toBe(false);
    expect(required.execute({value: null}, ctx)).toBe(false);
    expect(required.execute({value: undefined}, ctx)).toBe(false);
    expect(required.execute({value: []}, ctx)).toBe(false);
  });
});
