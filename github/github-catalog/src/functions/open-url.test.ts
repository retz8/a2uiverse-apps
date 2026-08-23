import {describe, it, expect, vi, afterEach} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {openUrl} from './open-url';

const ctx = {} as DataContext;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('openUrl function', () => {
  it('declares its api', () => {
    expect(openUrl.name).toBe('openUrl');
    expect(openUrl.returnType).toBe('void');
  });

  it('validates its args (url required)', () => {
    expect(openUrl.schema.safeParse({url: 'https://github.com'}).success).toBe(true);
    expect(openUrl.schema.safeParse({}).success).toBe(false);
  });

  it('opens the url in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openUrl.execute({url: 'https://github.com/a2ui-project/a2ui/pull/1668'}, ctx);
    expect(open).toHaveBeenCalledWith(
      'https://github.com/a2ui-project/a2ui/pull/1668',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
