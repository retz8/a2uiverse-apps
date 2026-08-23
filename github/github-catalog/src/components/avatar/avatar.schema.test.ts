import {describe, it, expect} from 'vitest';
import {AvatarApi} from './avatar.schema';

const src = 'https://example.com/octocat.png';

describe('AvatarApi.schema', () => {
  it('accepts a minimal valid Avatar (src only)', () => {
    expect(AvatarApi.schema.safeParse({src}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(AvatarApi.schema.safeParse({src, alt: 'Octocat', size: 48, square: true}).success).toBe(
      true,
    );
  });

  it('requires src', () => {
    expect(AvatarApi.schema.safeParse({alt: 'Octocat'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(AvatarApi.schema.safeParse({src, className: 'big'}).success).toBe(false);
  });

  it('accepts a data-binding for src (DynamicString)', () => {
    expect(AvatarApi.schema.safeParse({src: {path: '/avatarUrl'}}).success).toBe(true);
  });

  it('accepts a data-binding for alt (DynamicString)', () => {
    expect(AvatarApi.schema.safeParse({src, alt: {path: '/altText'}}).success).toBe(true);
  });

  it('rejects a non-numeric size', () => {
    expect(AvatarApi.schema.safeParse({src, size: 'large'}).success).toBe(false);
  });
});
