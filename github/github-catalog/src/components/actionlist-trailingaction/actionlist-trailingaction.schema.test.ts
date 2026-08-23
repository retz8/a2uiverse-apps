import {describe, it, expect} from 'vitest';
import {ActionListTrailingActionApi} from './actionlist-trailingaction.schema';

const action = {event: {name: 'remove'}};

describe('ActionListTrailingActionApi.schema', () => {
  it('accepts a minimal valid TrailingAction (icon + label)', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({icon: 'kebab', label: 'More options'}).success,
    ).toBe(true);
  });

  it('accepts the full prop surface (button mode with action)', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({
        icon: 'trash',
        label: 'Remove label',
        action,
        as: 'button',
        loading: false,
      }).success,
    ).toBe(true);
  });

  it('accepts link mode (as: a + href)', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({
        icon: 'link',
        label: 'Open',
        as: 'a',
        href: 'https://github.com',
      }).success,
    ).toBe(true);
  });

  it('accepts an event action', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({
        icon: 'i',
        label: 'x',
        action: {event: {name: 'remove'}},
      }).success,
    ).toBe(true);
  });

  it('accepts a functionCall action', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({
        icon: 'i',
        label: 'x',
        action: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
      }).success,
    ).toBe(true);
  });

  it('requires icon', () => {
    expect(ActionListTrailingActionApi.schema.safeParse({label: 'x'}).success).toBe(false);
  });

  it('requires label', () => {
    expect(ActionListTrailingActionApi.schema.safeParse({icon: 'i'}).success).toBe(false);
  });

  it('accepts a data-binding for loading (DynamicBoolean)', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({
        icon: 'i',
        label: 'x',
        loading: {path: '/busy'},
      }).success,
    ).toBe(true);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({icon: 'i', label: 'x', variant: 'danger'})
        .success,
    ).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(
      ActionListTrailingActionApi.schema.safeParse({icon: 'i', label: 'x', as: 'div'}).success,
    ).toBe(false);
  });
});
