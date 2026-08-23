import {describe, it, expect} from 'vitest';
import {ButtonGroupApi} from './buttongroup.schema';

describe('ButtonGroupApi.schema', () => {
  it('accepts a minimal valid ButtonGroup (every prop optional)', () => {
    expect(ButtonGroupApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface ButtonGroup', () => {
    expect(
      ButtonGroupApi.schema.safeParse({
        children: ['a', 'b', 'c'],
        role: 'toolbar',
        as: 'span',
      }).success,
    ).toBe(true);
  });

  it('accepts a static ChildList (array of ids)', () => {
    expect(ButtonGroupApi.schema.safeParse({children: ['a', 'b']}).success).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      ButtonGroupApi.schema.safeParse({children: {componentId: 'tpl', path: '/actions'}}).success,
    ).toBe(true);
  });

  it('accepts both role values', () => {
    expect(ButtonGroupApi.schema.safeParse({role: 'group'}).success).toBe(true);
    expect(ButtonGroupApi.schema.safeParse({role: 'toolbar'}).success).toBe(true);
  });

  it('accepts both as values', () => {
    expect(ButtonGroupApi.schema.safeParse({as: 'div'}).success).toBe(true);
    expect(ButtonGroupApi.schema.safeParse({as: 'span'}).success).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(ButtonGroupApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });

  it('rejects an out-of-enum role', () => {
    expect(ButtonGroupApi.schema.safeParse({role: 'menu'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(ButtonGroupApi.schema.safeParse({as: 'ul'}).success).toBe(false);
  });
});
