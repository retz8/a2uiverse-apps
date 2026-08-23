import {describe, it, expect, vi} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {setBoolean} from './set-boolean.js';

describe('setBoolean function', () => {
  it('declares its api', () => {
    expect(setBoolean.name).toBe('setBoolean');
    expect(setBoolean.returnType).toBe('void');
  });

  it('validates its args (path and value both required)', () => {
    expect(setBoolean.schema.safeParse({path: '/dialogOpen', value: false}).success).toBe(true);
    expect(setBoolean.schema.safeParse({path: '/dialogOpen'}).success).toBe(false);
    expect(setBoolean.schema.safeParse({value: false}).success).toBe(false);
    expect(setBoolean.schema.safeParse({path: '/dialogOpen', value: 'no'}).success).toBe(false);
  });

  it('writes false to the given path when executed', () => {
    const set = vi.fn();
    setBoolean.execute({path: '/dialogOpen', value: false}, {set} as unknown as DataContext);
    expect(set).toHaveBeenCalledWith('/dialogOpen', false);
  });

  it('writes true to the given path when executed', () => {
    const set = vi.fn();
    setBoolean.execute({path: '/dialogOpen', value: true}, {set} as unknown as DataContext);
    expect(set).toHaveBeenCalledWith('/dialogOpen', true);
  });
});
