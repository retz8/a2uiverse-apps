import {describe, it, expect} from 'vitest';
import {signal} from '@preact/signals-core';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {formatString} from './format-string';

// formatString is the one adopted function that genuinely uses the data context: it parses the
// template's ${...} blocks and calls resolveSignal on each, then returns a computed signal over
// the resolved parts. The stub below stands in for the binder; the renderer-level proof that the
// signal actually repaints lives in the client fixture (format-string-bound).
function contextWith(values: Record<string, unknown>): DataContext {
  return {
    resolveSignal: (part: {path?: string}) => signal(values[part.path ?? ''] ?? ''),
  } as unknown as DataContext;
}

function read(result: unknown): string {
  return (result as {value: string}).value ?? (result as string);
}

describe('formatString function', () => {
  it('declares its api', () => {
    expect(formatString.name).toBe('formatString');
  });

  it('declares returnType string, not the upstream any', () => {
    // @a2ui/web_core declares `any`; the published basic catalog declares `string` and we follow
    // the catalog, because returnType is a declaration the agent reads.
    expect(formatString.returnType).toBe('string');
  });

  it('validates its args (value required)', () => {
    expect(formatString.schema.safeParse({value: 'hello'}).success).toBe(true);
    expect(formatString.schema.safeParse({}).success).toBe(false);
  });

  it('passes a literal template through unchanged', () => {
    expect(read(formatString.execute({value: 'Open pull requests'}, contextWith({})))).toBe(
      'Open pull requests',
    );
  });

  it('interpolates a data-model path into the template', () => {
    const ctx = contextWith({'/pr/title': 'Fix heading levels'});
    expect(read(formatString.execute({value: 'PR: ${/pr/title}'}, ctx))).toBe(
      'PR: Fix heading levels',
    );
  });

  it('returns a reactive value that tracks its dependency', () => {
    const title = signal('Fix heading levels');
    const ctx = {resolveSignal: () => title} as unknown as DataContext;
    const result = formatString.execute({value: 'PR: ${/pr/title}'}, ctx) as unknown as {
      value: string;
    };
    expect(result.value).toBe('PR: Fix heading levels');
    title.value = 'Revert heading cleanup';
    expect(result.value).toBe('PR: Revert heading cleanup');
  });
});
