import {describe, it, expect} from 'vitest';
import {TruncateApi} from './truncate.schema';

describe('TruncateApi.schema', () => {
  it('accepts a minimal valid Truncate (text + title only)', () => {
    expect(TruncateApi.schema.safeParse({text: 'main.ts', title: 'main.ts'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = TruncateApi.schema.safeParse({
      text: 'src/components/navigation/PrimaryNavigationMenu.tsx',
      title: 'src/components/navigation/PrimaryNavigationMenu.tsx',
      inline: true,
      expandable: true,
      maxWidth: '300px',
      as: 'span',
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(TruncateApi.schema.safeParse({title: 'main.ts'}).success).toBe(false);
  });

  it('requires title', () => {
    expect(TruncateApi.schema.safeParse({text: 'main.ts'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      TruncateApi.schema.safeParse({text: 'main.ts', title: 'main.ts', className: 'x'}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum values for as', () => {
    expect(
      TruncateApi.schema.safeParse({text: 'main.ts', title: 'main.ts', as: 'label'}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(TruncateApi.schema.safeParse({text: {path: '/full'}, title: 'main.ts'}).success).toBe(
      true,
    );
  });

  it('accepts a data-binding for title (DynamicString)', () => {
    expect(TruncateApi.schema.safeParse({text: 'main.ts', title: {path: '/full'}}).success).toBe(
      true,
    );
  });
});
