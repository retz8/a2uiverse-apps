import {describe, it, expect, vi} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {clearValue} from './clear-value';

describe('clearValue function', () => {
  it('declares its api', () => {
    expect(clearValue.name).toBe('clearValue');
    expect(clearValue.returnType).toBe('void');
  });

  it('validates its args (path required)', () => {
    expect(clearValue.schema.safeParse({path: '/query'}).success).toBe(true);
    expect(clearValue.schema.safeParse({}).success).toBe(false);
  });

  it('writes the empty string to the given path on the data context when executed', () => {
    const set = vi.fn();
    clearValue.execute({path: '/query'}, {set} as unknown as DataContext);
    expect(set).toHaveBeenCalledWith('/query', '');
  });
});
