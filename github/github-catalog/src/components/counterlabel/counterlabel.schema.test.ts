import {describe, it, expect} from 'vitest';
import {CounterLabelApi} from './counterlabel.schema';

describe('CounterLabelApi.schema', () => {
  it('accepts a minimal valid CounterLabel (count only)', () => {
    expect(CounterLabelApi.schema.safeParse({count: 12}).success).toBe(true);
  });

  it('rejects a string count (count is a number)', () => {
    expect(CounterLabelApi.schema.safeParse({count: '12'}).success).toBe(false);
  });

  it('accepts the full prop surface', () => {
    const result = CounterLabelApi.schema.safeParse({count: 12, variant: 'primary'});
    expect(result.success).toBe(true);
  });

  it('requires count', () => {
    expect(CounterLabelApi.schema.safeParse({variant: 'primary'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(CounterLabelApi.schema.safeParse({count: 12, scheme: 'primary'}).success).toBe(false);
  });

  it('rejects out-of-enum variant values', () => {
    expect(CounterLabelApi.schema.safeParse({count: 12, variant: 'tertiary'}).success).toBe(false);
  });

  it('accepts a data-binding for count (DynamicNumber)', () => {
    expect(CounterLabelApi.schema.safeParse({count: {path: '/notifications'}}).success).toBe(true);
  });

  it('accepts a number-returning function call for count', () => {
    const call = {call: 'countSelected', args: {items: {path: '/prs'}}, returnType: 'number'};
    expect(CounterLabelApi.schema.safeParse({count: call}).success).toBe(true);
  });
});
