import {describe, it, expect} from 'vitest';
import {SkeletonBoxApi} from './skeletonbox.schema';

describe('SkeletonBoxApi.schema', () => {
  it('accepts an empty SkeletonBox (all props optional)', () => {
    expect(SkeletonBoxApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = SkeletonBoxApi.schema.safeParse({
      height: '80px',
      width: '200px',
      delay: 'short',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(SkeletonBoxApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });

  it('rejects out-of-enum delay values', () => {
    expect(SkeletonBoxApi.schema.safeParse({delay: 'medium'}).success).toBe(false);
  });

  it('rejects a non-string height (dimensions are plain CSS length strings)', () => {
    expect(SkeletonBoxApi.schema.safeParse({height: 80}).success).toBe(false);
  });
});
