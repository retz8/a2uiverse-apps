import {describe, it, expect} from 'vitest';
import {ToggleSwitchApi} from './toggleswitch.schema';

const accessibility = {label: 'Notifications'};

describe('ToggleSwitchApi.schema', () => {
  it('accepts a minimal valid ToggleSwitch (checked + accessibility)', () => {
    expect(ToggleSwitchApi.schema.safeParse({checked: false, accessibility}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    const result = ToggleSwitchApi.schema.safeParse({
      checked: true,
      action: {event: {name: 'toggle'}},
      disabled: false,
      loading: false,
      size: 'small',
      statusLabelPosition: 'end',
      buttonLabelOn: 'Show',
      buttonLabelOff: 'Hide',
      loadingLabel: 'Saving',
      loadingLabelDelay: 1000,
      accessibility: {label: 'Notifications', description: 'Email me when mentioned'},
    });
    expect(result.success).toBe(true);
  });

  it('accepts an event action', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({
        checked: false,
        accessibility,
        action: {event: {name: 'toggle'}},
      }).success,
    ).toBe(true);
  });

  it('accepts a functionCall action', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({
        checked: false,
        accessibility,
        action: {functionCall: {call: 'consoleLog', args: {message: 'hi'}}},
      }).success,
    ).toBe(true);
  });

  it('requires checked', () => {
    expect(ToggleSwitchApi.schema.safeParse({accessibility}).success).toBe(false);
  });

  it('requires accessibility', () => {
    expect(ToggleSwitchApi.schema.safeParse({checked: false}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({checked: false, accessibility, color: 'red'}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum size', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({checked: false, accessibility, size: 'large'}).success,
    ).toBe(false);
  });

  it('rejects out-of-enum statusLabelPosition', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({
        checked: false,
        accessibility,
        statusLabelPosition: 'center',
      }).success,
    ).toBe(false);
  });

  it('accepts a data-binding for checked (DynamicBoolean)', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({checked: {path: '/setting'}, accessibility}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for disabled (DynamicBoolean)', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({
        checked: false,
        accessibility,
        disabled: {path: '/locked'},
      }).success,
    ).toBe(true);
  });

  it('accepts a data-binding for loading (DynamicBoolean)', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({
        checked: false,
        accessibility,
        loading: {path: '/saving'},
      }).success,
    ).toBe(true);
  });

  it('accepts accessibility label and description', () => {
    expect(
      ToggleSwitchApi.schema.safeParse({
        checked: false,
        accessibility: {label: 'Notifications', description: 'Toggle email alerts'},
      }).success,
    ).toBe(true);
  });
});
