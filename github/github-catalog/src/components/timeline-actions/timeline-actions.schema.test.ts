import {describe, it, expect} from 'vitest';
import {TimelineActionsApi} from './timeline-actions.schema';

describe('TimelineActionsApi.schema', () => {
  it('accepts a minimal valid Actions (children only)', () => {
    expect(TimelineActionsApi.schema.safeParse({children: ['button']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      TimelineActionsApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('rejects a missing required children', () => {
    expect(TimelineActionsApi.schema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(TimelineActionsApi.schema.safeParse({children: ['a'], color: 'red'}).success).toBe(
      false,
    );
  });
});
