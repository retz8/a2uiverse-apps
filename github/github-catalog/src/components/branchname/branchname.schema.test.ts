import {describe, it, expect} from 'vitest';
import {BranchNameApi} from './branchname.schema';

describe('BranchNameApi.schema', () => {
  it('accepts a minimal valid BranchName (text only)', () => {
    expect(BranchNameApi.schema.safeParse({text: 'main'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = BranchNameApi.schema.safeParse({
      text: 'main',
      href: 'https://github.com/a2ui-project/a2ui/tree/main',
      as: 'span',
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(BranchNameApi.schema.safeParse({href: 'https://example.com'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(BranchNameApi.schema.safeParse({text: 'main', className: 'x'}).success).toBe(false);
  });

  it('rejects out-of-enum values for as', () => {
    expect(BranchNameApi.schema.safeParse({text: 'main', as: 'div'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(BranchNameApi.schema.safeParse({text: {path: '/branch'}}).success).toBe(true);
  });

  it('accepts a data-binding for href (DynamicString)', () => {
    expect(BranchNameApi.schema.safeParse({text: 'main', href: {path: '/url'}}).success).toBe(true);
  });
});
