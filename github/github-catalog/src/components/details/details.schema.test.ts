import {describe, it, expect} from 'vitest';
import {DetailsApi} from './details.schema';

describe('DetailsApi.schema', () => {
  it('accepts a minimal valid Details (summary + open only)', () => {
    expect(DetailsApi.schema.safeParse({summary: 'sum', open: false}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      DetailsApi.schema.safeParse({
        summary: 'sum',
        children: ['b1', 'b2'],
        open: true,
        closeOnOutsideClick: true,
        onClickOutside: {
          functionCall: {call: 'windowAlert', args: {message: 'x'}, returnType: 'void'},
        },
        accessibility: {label: 'Show details'},
      }).success,
    ).toBe(true);
  });

  it('requires summary', () => {
    expect(DetailsApi.schema.safeParse({open: false}).success).toBe(false);
  });

  it('requires open', () => {
    expect(DetailsApi.schema.safeParse({summary: 'sum'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(DetailsApi.schema.safeParse({summary: 'sum', open: false, color: 'red'}).success).toBe(
      false,
    );
  });

  it('accepts a data-binding for open (DynamicBoolean)', () => {
    expect(DetailsApi.schema.safeParse({summary: 'sum', open: {path: '/expanded'}}).success).toBe(
      true,
    );
  });

  it('accepts a dynamic-template ChildList for children', () => {
    expect(
      DetailsApi.schema.safeParse({
        summary: 'sum',
        open: true,
        children: {componentId: 'tpl', path: '/items'},
      }).success,
    ).toBe(true);
  });
});
