import {describe, it, expect} from 'vitest';
import {SpinnerApi} from './spinner.schema';

describe('SpinnerApi.schema', () => {
  it('accepts a minimal valid Spinner (no props — all optional)', () => {
    expect(SpinnerApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = SpinnerApi.schema.safeParse({
      size: 'large',
      srText: 'Loading results',
      delay: 'short',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(SpinnerApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects out-of-enum size values', () => {
    expect(SpinnerApi.schema.safeParse({size: 'medium-large'}).success).toBe(false);
  });

  it('rejects out-of-enum delay values', () => {
    expect(SpinnerApi.schema.safeParse({delay: 'instant'}).success).toBe(false);
  });

  it('accepts a data-binding for srText (DynamicString)', () => {
    expect(SpinnerApi.schema.safeParse({srText: {path: '/status'}}).success).toBe(true);
  });

  it('accepts null for srText (nullable — suppresses the hidden text)', () => {
    expect(SpinnerApi.schema.safeParse({srText: null}).success).toBe(true);
  });
});
