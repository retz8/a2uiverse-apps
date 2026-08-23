import {describe, it, expect, vi} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {consoleLog} from './console-log';

describe('consoleLog function', () => {
  it('declares its api', () => {
    expect(consoleLog.name).toBe('consoleLog');
    expect(consoleLog.returnType).toBe('void');
  });

  it('validates its args (message required)', () => {
    expect(consoleLog.schema.safeParse({message: 'hi'}).success).toBe(true);
    expect(consoleLog.schema.safeParse({}).success).toBe(false);
  });

  it('logs the message when executed', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleLog.execute({message: 'hello'}, {} as DataContext);
    expect(spy).toHaveBeenCalledWith('[A2UI]', 'hello');
    spy.mockRestore();
  });
});
