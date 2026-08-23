import {describe, it, expect} from 'vitest';
import {LinkApi} from './link.schema';

describe('LinkApi.schema', () => {
  it('accepts a minimal valid Link (text + href only)', () => {
    expect(LinkApi.schema.safeParse({text: 'View', href: 'https://github.com'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = LinkApi.schema.safeParse({
      text: 'View',
      href: 'https://github.com',
      muted: true,
      inline: true,
      target: '_blank',
      accessibility: {label: 'View on GitHub'},
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    expect(LinkApi.schema.safeParse({href: 'https://github.com'}).success).toBe(false);
  });

  it('requires href', () => {
    expect(LinkApi.schema.safeParse({text: 'View'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      LinkApi.schema.safeParse({text: 'View', href: 'https://github.com', as: 'button'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum target', () => {
    expect(
      LinkApi.schema.safeParse({text: 'View', href: 'https://github.com', target: '_top'}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(
      LinkApi.schema.safeParse({text: {path: '/linkText'}, href: 'https://github.com'}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for href (DynamicString)', () => {
    expect(LinkApi.schema.safeParse({text: 'View', href: {path: '/linkUrl'}}).success).toBe(true);
  });
});
