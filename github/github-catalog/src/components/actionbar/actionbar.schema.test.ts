import {describe, it, expect} from 'vitest';
import {ActionBarApi} from './actionbar.schema';

const accessibility = {label: 'Formatting'};

describe('ActionBarApi.schema', () => {
  it('accepts a minimal valid ActionBar (children + accessibility)', () => {
    expect(ActionBarApi.schema.safeParse({children: ['b1', 'b2'], accessibility}).success).toBe(
      true,
    );
  });

  it('accepts a full-surface ActionBar', () => {
    expect(
      ActionBarApi.schema.safeParse({
        children: ['b1', 'b2', 'b3'],
        size: 'large',
        flush: true,
        gap: 'none',
        accessibility,
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(ActionBarApi.schema.safeParse({children: ['b1', 'b2'], accessibility}).success).toBe(
      true,
    );
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      ActionBarApi.schema.safeParse({
        children: {componentId: 'tpl', path: '/actions'},
        accessibility,
      }).success,
    ).toBe(true);
  });

  it('requires children', () => {
    expect(ActionBarApi.schema.safeParse({accessibility}).success).toBe(false);
  });

  it('requires accessibility', () => {
    expect(ActionBarApi.schema.safeParse({children: ['b1']}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      ActionBarApi.schema.safeParse({children: ['b1'], accessibility, className: 'x'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum size', () => {
    expect(
      ActionBarApi.schema.safeParse({children: ['b1'], accessibility, size: 'huge'}).success,
    ).toBe(false);
  });

  it('rejects an out-of-enum gap', () => {
    expect(
      ActionBarApi.schema.safeParse({children: ['b1'], accessibility, gap: 'spacious'}).success,
    ).toBe(false);
  });
});
