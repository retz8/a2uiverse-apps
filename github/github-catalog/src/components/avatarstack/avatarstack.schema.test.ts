import {describe, it, expect} from 'vitest';
import {AvatarStackApi} from './avatarstack.schema';

describe('AvatarStackApi.schema', () => {
  it('accepts a minimal valid AvatarStack (children only)', () => {
    expect(AvatarStackApi.schema.safeParse({children: ['a']}).success).toBe(true);
  });

  it('accepts a full-surface AvatarStack', () => {
    expect(
      AvatarStackApi.schema.safeParse({
        children: ['a', 'b', 'c'],
        alignRight: true,
        disableExpand: true,
        variant: 'stack',
        shape: 'square',
        size: 32,
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(AvatarStackApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      AvatarStackApi.schema.safeParse({children: {componentId: 'tpl', path: '/users'}}).success,
    ).toBe(true);
  });

  it('accepts a responsive size map', () => {
    expect(
      AvatarStackApi.schema.safeParse({children: ['a'], size: {narrow: 16, regular: 32, wide: 48}})
        .success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(AvatarStackApi.schema.safeParse({variant: 'cascade'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(AvatarStackApi.schema.safeParse({children: ['a'], color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(AvatarStackApi.schema.safeParse({children: ['a'], variant: 'overlap'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum shape', () => {
    expect(AvatarStackApi.schema.safeParse({children: ['a'], shape: 'rounded'}).success).toBe(
      false,
    );
  });

  it('rejects a non-number size', () => {
    expect(AvatarStackApi.schema.safeParse({children: ['a'], size: 'large'}).success).toBe(false);
  });
});
