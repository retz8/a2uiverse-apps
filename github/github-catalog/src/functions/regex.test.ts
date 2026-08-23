import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {regex} from './regex';

const ctx = {} as DataContext;

describe('regex function', () => {
  it('declares its api', () => {
    expect(regex.name).toBe('regex');
    expect(regex.returnType).toBe('boolean');
  });

  it('validates its args (value and pattern both required)', () => {
    expect(regex.schema.safeParse({value: 'abc', pattern: '^a'}).success).toBe(true);
    expect(regex.schema.safeParse({value: 'abc'}).success).toBe(false);
    expect(regex.schema.safeParse({pattern: '^a'}).success).toBe(false);
  });

  it('coerces a non-string value rather than rejecting it', () => {
    // The catalog invoker parses args on every invocation and throws on failure, so an agent
    // emitting a number where a string is declared must coerce, not break the render.
    expect(regex.schema.safeParse({value: 42, pattern: '^4'}).success).toBe(true);
  });

  it('matches and rejects against the pattern', () => {
    expect(regex.execute({value: 'a2ui-project', pattern: '^a2ui'}, ctx)).toBe(true);
    expect(regex.execute({value: 'primer', pattern: '^a2ui'}, ctx)).toBe(false);
  });
});
