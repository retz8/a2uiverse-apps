import {describe, it, expect} from 'vitest';
import {RadioGroupApi} from './radiogroup.schema';

describe('RadioGroupApi.schema', () => {
  it('accepts a minimal valid RadioGroup (children + name)', () => {
    expect(
      RadioGroupApi.schema.safeParse({children: ['label', 'option'], name: 'choices'}).success,
    ).toBe(true);
  });

  it('accepts a full-surface RadioGroup', () => {
    expect(
      RadioGroupApi.schema.safeParse({
        children: ['label', 'caption', 'validation', 'option'],
        name: 'choices',
        action: {event: {name: 'select', context: {}}},
        disabled: true,
        required: true,
        'aria-labelledby': 'external-label',
      }).success,
    ).toBe(true);
  });

  it('rejects missing required children', () => {
    expect(RadioGroupApi.schema.safeParse({name: 'choices'}).success).toBe(false);
  });

  it('rejects missing required name', () => {
    expect(RadioGroupApi.schema.safeParse({children: ['option']}).success).toBe(false);
  });

  it('rejects an id prop (id is a framework-owned envelope field, not an authorable prop)', () => {
    expect(
      RadioGroupApi.schema.safeParse({children: ['option'], name: 'choices', id: 'group'}).success,
    ).toBe(false);
  });

  it('accepts a bound (path) disabled', () => {
    expect(
      RadioGroupApi.schema.safeParse({
        children: ['option'],
        name: 'choices',
        disabled: {path: '/locked'},
      }).success,
    ).toBe(true);
  });

  it('accepts a functionCall action', () => {
    expect(
      RadioGroupApi.schema.safeParse({
        children: ['option'],
        name: 'choices',
        action: {functionCall: {call: 'consoleLog', args: {message: 'x'}, returnType: 'void'}},
      }).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      RadioGroupApi.schema.safeParse({children: ['option'], name: 'choices', className: 'x'})
        .success,
    ).toBe(false);
  });
});
