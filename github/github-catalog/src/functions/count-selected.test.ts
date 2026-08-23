import {describe, it, expect} from 'vitest';
import type {DataContext} from '@a2ui/web_core/v0_9';
import {countSelected} from './count-selected.js';

describe('countSelected function', () => {
  it('declares its api', () => {
    expect(countSelected.name).toBe('countSelected');
    expect(countSelected.returnType).toBe('number');
  });

  it('validates its args (items list required)', () => {
    expect(countSelected.schema.safeParse({items: []}).success).toBe(true);
    expect(countSelected.schema.safeParse({}).success).toBe(false);
    expect(countSelected.schema.safeParse({items: 'nope'}).success).toBe(false);
  });

  it('counts the items whose selected field is true', () => {
    const items = [
      {title: 'a', selected: true},
      {title: 'b', selected: false},
      {title: 'c', selected: true},
      {title: 'd'}, // no selected field — not counted
    ];
    expect(countSelected.execute({items}, {} as DataContext)).toBe(2);
  });

  it('counts zero on an empty list', () => {
    expect(countSelected.execute({items: []}, {} as DataContext)).toBe(0);
  });
});
