import {describe, it, expect} from 'vitest';
import {TimelineBodyApi} from './timeline-body.schema';

describe('TimelineBodyApi.schema', () => {
  it('accepts a minimal valid Body (children only)', () => {
    expect(TimelineBodyApi.schema.safeParse({children: ['text']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      TimelineBodyApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(TimelineBodyApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TimelineBodyApi.schema.safeParse({children: ['a'], color: 'red'}).success).toBe(false);
  });
});
