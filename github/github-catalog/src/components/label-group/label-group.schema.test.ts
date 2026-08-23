import {describe, it, expect} from 'vitest';
import {LabelGroupApi} from './label-group.schema';

describe('LabelGroupApi.schema', () => {
  it('accepts a minimal valid LabelGroup (every prop optional)', () => {
    expect(LabelGroupApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface LabelGroup', () => {
    expect(
      LabelGroupApi.schema.safeParse({
        children: ['l1', 'l2', 'l3'],
        overflowStyle: 'inline',
        visibleChildCount: 3,
        as: 'ol',
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(LabelGroupApi.schema.safeParse({children: ['l1', 'l2']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      LabelGroupApi.schema.safeParse({children: {componentId: 'tpl', path: '/labels'}}).success,
    ).toBe(true);
  });

  it('accepts both overflowStyle values', () => {
    expect(LabelGroupApi.schema.safeParse({overflowStyle: 'inline'}).success).toBe(true);
    expect(LabelGroupApi.schema.safeParse({overflowStyle: 'overlay'}).success).toBe(true);
  });

  it("accepts visibleChildCount 'auto'", () => {
    expect(LabelGroupApi.schema.safeParse({visibleChildCount: 'auto'}).success).toBe(true);
  });

  it('accepts a positive-integer visibleChildCount', () => {
    expect(LabelGroupApi.schema.safeParse({visibleChildCount: 5}).success).toBe(true);
  });

  it('accepts every as enum member', () => {
    for (const as of ['ul', 'ol', 'div', 'span']) {
      expect(LabelGroupApi.schema.safeParse({as}).success).toBe(true);
    }
  });

  it('rejects unknown props (strict)', () => {
    expect(LabelGroupApi.schema.safeParse({className: 'x'}).success).toBe(false);
  });

  it('rejects an out-of-enum overflowStyle', () => {
    expect(LabelGroupApi.schema.safeParse({overflowStyle: 'popover'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(LabelGroupApi.schema.safeParse({as: 'table'}).success).toBe(false);
  });

  it('rejects a non-positive or non-integer visibleChildCount', () => {
    expect(LabelGroupApi.schema.safeParse({visibleChildCount: 0}).success).toBe(false);
    expect(LabelGroupApi.schema.safeParse({visibleChildCount: -2}).success).toBe(false);
    expect(LabelGroupApi.schema.safeParse({visibleChildCount: 2.5}).success).toBe(false);
    expect(LabelGroupApi.schema.safeParse({visibleChildCount: 'some'}).success).toBe(false);
  });
});
