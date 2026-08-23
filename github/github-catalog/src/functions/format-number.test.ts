import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {formatNumber} from './format-number.js';

const ctx = {} as DataContext;

// Execute against parsed args, as the catalog invoker does — `grouping` carries a parse-time
// default that the implementation reads.
const run = (args: Record<string, unknown>) =>
  formatNumber.execute(formatNumber.schema.parse(args), ctx);

describe('formatNumber function', () => {
  it('declares its api', () => {
    expect(formatNumber.name).toBe('formatNumber');
    expect(formatNumber.returnType).toBe('string');
  });

  it('validates its args (value required, decimals and grouping optional)', () => {
    expect(formatNumber.schema.safeParse({value: 1000}).success).toBe(true);
    expect(formatNumber.schema.safeParse({value: 1000, decimals: 2}).success).toBe(true);
    expect(formatNumber.schema.safeParse({}).success).toBe(false);
  });

  it('defaults grouping to true at parse time', () => {
    expect(formatNumber.schema.parse({value: 1000}).grouping).toBe(true);
  });

  it('groups by default and can be told not to', () => {
    expect(run({value: 1000})).toBe('1,000');
    expect(run({value: 1000, grouping: false})).toBe('1000');
  });

  it('honours a decimal count', () => {
    expect(run({value: 3.14159, decimals: 2})).toBe('3.14');
  });
});
