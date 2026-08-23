import {describe, it, expect} from 'vitest';
import {StackApi} from './stack.schema';

describe('StackApi.schema', () => {
  it('accepts a minimal valid Stack (every prop optional)', () => {
    expect(StackApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface Stack', () => {
    expect(
      StackApi.schema.safeParse({
        children: ['a', 'b', 'c'],
        direction: 'horizontal',
        gap: 'normal',
        align: 'center',
        justify: 'space-between',
        wrap: 'wrap',
        padding: 'spacious',
        paddingBlock: 'condensed',
        paddingInline: 'cozy',
        as: 'nav',
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(StackApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      StackApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}}).success,
    ).toBe(true);
  });

  it('accepts a responsive object for a scale prop', () => {
    expect(
      StackApi.schema.safeParse({direction: {narrow: 'vertical', regular: 'horizontal'}}).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(StackApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum scalar scale value', () => {
    expect(StackApi.schema.safeParse({direction: 'diagonal'}).success).toBe(false);
  });

  it('rejects an out-of-enum responsive-map value', () => {
    expect(StackApi.schema.safeParse({align: {narrow: 'sideways'}}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(StackApi.schema.safeParse({as: 'table'}).success).toBe(false);
  });
});
