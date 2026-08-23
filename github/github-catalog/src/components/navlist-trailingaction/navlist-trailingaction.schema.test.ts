import {describe, it, expect} from 'vitest';
import {NavListTrailingActionApi} from './navlist-trailingaction.schema';

const action = {event: {name: 'pin'}};
const accessibility = {label: 'Pin'};

describe('NavListTrailingActionApi.schema', () => {
  it('accepts a minimal valid TrailingAction (icon + accessibility + action)', () => {
    expect(
      NavListTrailingActionApi.schema.safeParse({icon: 'pin-icon', accessibility, action}).success,
    ).toBe(true);
  });

  it('accepts a functionCall action', () => {
    expect(
      NavListTrailingActionApi.schema.safeParse({
        icon: 'pin-icon',
        accessibility,
        action: {functionCall: {call: 'consoleLog', args: {message: 'pin'}}},
      }).success,
    ).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      NavListTrailingActionApi.schema.safeParse({
        icon: 'pin-icon',
        accessibility: {label: 'Pin', description: 'Pin this item'},
        action,
        loading: true,
      }).success,
    ).toBe(true);
  });

  it('requires icon', () => {
    expect(NavListTrailingActionApi.schema.safeParse({accessibility, action}).success).toBe(false);
  });

  it('requires accessibility (an icon-only control must be labeled)', () => {
    expect(NavListTrailingActionApi.schema.safeParse({icon: 'pin-icon', action}).success).toBe(
      false,
    );
  });

  it('requires action', () => {
    expect(
      NavListTrailingActionApi.schema.safeParse({icon: 'pin-icon', accessibility}).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      NavListTrailingActionApi.schema.safeParse({
        icon: 'pin-icon',
        accessibility,
        action,
        href: '#',
      }).success,
    ).toBe(false);
  });

  it('accepts a data-binding for loading (DynamicBoolean)', () => {
    expect(
      NavListTrailingActionApi.schema.safeParse({
        icon: 'pin-icon',
        accessibility,
        action,
        loading: {path: '/loading'},
      }).success,
    ).toBe(true);
  });
});
