import {describe, it, expect} from 'vitest';
import {TimelineItemApi} from './timeline-item.schema';

describe('TimelineItemApi.schema', () => {
  it('accepts a minimal valid Item (children only)', () => {
    expect(TimelineItemApi.schema.safeParse({children: ['badge', 'body']}).success).toBe(true);
  });

  it('accepts a full-surface Item', () => {
    expect(
      TimelineItemApi.schema.safeParse({children: ['badge', 'body'], condensed: true}).success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(TimelineItemApi.schema.safeParse({condensed: true}).success).toBe(false);
  });

  it('rejects a non-boolean condensed', () => {
    expect(TimelineItemApi.schema.safeParse({children: ['a'], condensed: 'yes'}).success).toBe(
      false,
    );
  });

  it('rejects unknown props (strict)', () => {
    expect(TimelineItemApi.schema.safeParse({children: ['a'], color: 'red'}).success).toBe(false);
  });
});
