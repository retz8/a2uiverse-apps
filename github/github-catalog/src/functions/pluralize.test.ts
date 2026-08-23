import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {pluralize} from './pluralize.js';

const ctx = {} as DataContext;

describe('pluralize function', () => {
  it('declares its api', () => {
    expect(pluralize.name).toBe('pluralize');
    expect(pluralize.returnType).toBe('string');
  });

  it('validates its args (value and other required, categories optional)', () => {
    expect(pluralize.schema.safeParse({value: 2, other: '# comments'}).success).toBe(true);
    expect(pluralize.schema.safeParse({value: 2}).success).toBe(false);
    expect(pluralize.schema.safeParse({other: '# comments'}).success).toBe(false);
  });

  it('selects the category that agrees with the number', () => {
    const args = {one: '1 comment', other: 'many comments'};
    expect(pluralize.execute({value: 1, ...args}, ctx)).toBe('1 comment');
    expect(pluralize.execute({value: 3, ...args}, ctx)).toBe('many comments');
  });

  it('falls back to other when the matching category is absent', () => {
    expect(pluralize.execute({value: 0, other: 'no comments'}, ctx)).toBe('no comments');
  });
});
