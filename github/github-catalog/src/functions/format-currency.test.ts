import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {formatCurrency} from './format-currency';

const ctx = {} as DataContext;

const run = (args: Record<string, unknown>) =>
  formatCurrency.execute(formatCurrency.schema.parse(args), ctx);

describe('formatCurrency function', () => {
  it('declares its api', () => {
    expect(formatCurrency.name).toBe('formatCurrency');
    expect(formatCurrency.returnType).toBe('string');
  });

  it('validates its args (value and currency required)', () => {
    expect(formatCurrency.schema.safeParse({value: 10, currency: 'USD'}).success).toBe(true);
    expect(formatCurrency.schema.safeParse({value: 10}).success).toBe(false);
    expect(formatCurrency.schema.safeParse({currency: 'USD'}).success).toBe(false);
  });

  it('formats an amount in the given currency', () => {
    expect(run({value: 1234.5, currency: 'USD'})).toContain('1,234.5');
    expect(run({value: 1234.5, currency: 'USD'})).toContain('$');
  });
});
