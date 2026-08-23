import {describe, it, expect} from 'vitest';
import {TimelineApi} from './timeline.schema';

describe('TimelineApi.schema', () => {
  it('accepts a minimal valid Timeline (children only)', () => {
    expect(TimelineApi.schema.safeParse({children: ['item']}).success).toBe(true);
  });

  it('accepts a full-surface Timeline (boolean clipSidebar)', () => {
    expect(TimelineApi.schema.safeParse({children: ['a', 'b'], clipSidebar: true}).success).toBe(
      true,
    );
  });

  it('accepts each enum spelling of clipSidebar', () => {
    for (const clip of ['start', 'end', 'both'] as const) {
      expect(TimelineApi.schema.safeParse({children: ['a'], clipSidebar: clip}).success).toBe(true);
    }
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      TimelineApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('rejects an out-of-enum clipSidebar string', () => {
    expect(TimelineApi.schema.safeParse({children: ['a'], clipSidebar: 'middle'}).success).toBe(
      false,
    );
  });

  it('rejects a missing required children', () => {
    expect(TimelineApi.schema.safeParse({clipSidebar: true}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TimelineApi.schema.safeParse({children: ['a'], color: 'red'}).success).toBe(false);
  });
});
