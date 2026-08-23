import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {formatDate} from './format-date.js';

const ctx = {} as DataContext;

describe('formatDate function', () => {
  it('declares its api', () => {
    expect(formatDate.name).toBe('formatDate');
    expect(formatDate.returnType).toBe('string');
  });

  it('validates its args (value and format both required)', () => {
    expect(formatDate.schema.safeParse({value: '2026-01-16', format: 'yyyy'}).success).toBe(true);
    expect(formatDate.schema.safeParse({value: '2026-01-16'}).success).toBe(false);
    expect(formatDate.schema.safeParse({format: 'yyyy'}).success).toBe(false);
  });

  it('formats an ISO date against a TR35 pattern', () => {
    expect(formatDate.execute({value: '2026-01-16T14:30:00Z', format: 'yyyy'}, ctx)).toBe('2026');
    expect(formatDate.execute({value: '2026-01-16T14:30:00Z', format: 'MMM dd, yyyy'}, ctx)).toBe(
      'Jan 16, 2026',
    );
  });
});
