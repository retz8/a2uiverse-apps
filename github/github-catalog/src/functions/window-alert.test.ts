import {describe, it, expect, vi} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {windowAlert} from './window-alert';

describe('windowAlert function', () => {
  it('declares its api', () => {
    expect(windowAlert.name).toBe('windowAlert');
    expect(windowAlert.returnType).toBe('void');
  });

  it('validates its args (message required)', () => {
    expect(windowAlert.schema.safeParse({message: 'hi'}).success).toBe(true);
    expect(windowAlert.schema.safeParse({}).success).toBe(false);
  });

  it('shows the message in a browser alert when executed', () => {
    const spy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    windowAlert.execute({message: 'hello'}, {} as DataContext);
    expect(spy).toHaveBeenCalledWith('hello');
    spy.mockRestore();
  });
});
