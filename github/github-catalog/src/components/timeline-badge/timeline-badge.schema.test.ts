import {describe, it, expect} from 'vitest';
import {TimelineBadgeApi} from './timeline-badge.schema';

describe('TimelineBadgeApi.schema', () => {
  it('accepts a minimal valid Badge (child only)', () => {
    expect(TimelineBadgeApi.schema.safeParse({child: 'icon'}).success).toBe(true);
  });

  it('accepts each color variant', () => {
    for (const variant of [
      'accent',
      'success',
      'attention',
      'severe',
      'danger',
      'done',
      'open',
      'closed',
      'sponsors',
    ] as const) {
      expect(TimelineBadgeApi.schema.safeParse({child: 'icon', variant}).success).toBe(true);
    }
  });

  it('rejects a missing required child', () => {
    expect(TimelineBadgeApi.schema.safeParse({variant: 'success'}).success).toBe(false);
  });

  it('rejects an out-of-enum variant', () => {
    expect(TimelineBadgeApi.schema.safeParse({child: 'icon', variant: 'primary'}).success).toBe(
      false,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(TimelineBadgeApi.schema.safeParse({child: 'icon', color: 'red'}).success).toBe(false);
  });
});
