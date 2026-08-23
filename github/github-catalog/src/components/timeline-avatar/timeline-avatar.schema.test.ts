import {describe, it, expect} from 'vitest';
import {TimelineAvatarApi} from './timeline-avatar.schema';

describe('TimelineAvatarApi.schema', () => {
  it('accepts a minimal valid Avatar (child only)', () => {
    expect(TimelineAvatarApi.schema.safeParse({child: 'avatar'}).success).toBe(true);
  });

  it('rejects a missing required child', () => {
    expect(TimelineAvatarApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TimelineAvatarApi.schema.safeParse({child: 'avatar', color: 'red'}).success).toBe(false);
  });
});
