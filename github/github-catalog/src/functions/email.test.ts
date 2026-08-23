import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {email} from './email';

const ctx = {} as DataContext;

describe('email function', () => {
  it('declares its api', () => {
    expect(email.name).toBe('email');
    expect(email.returnType).toBe('boolean');
  });

  it('validates its args (value required)', () => {
    expect(email.schema.safeParse({value: 'a@b.co'}).success).toBe(true);
    expect(email.schema.safeParse({}).success).toBe(false);
  });

  it('accepts an address-shaped string', () => {
    expect(email.execute({value: 'maintainer@github.com'}, ctx)).toBe(true);
  });

  it('rejects a string that is not address-shaped', () => {
    expect(email.execute({value: 'maintainer'}, ctx)).toBe(false);
    expect(email.execute({value: 'maintainer@github'}, ctx)).toBe(false);
  });
});
