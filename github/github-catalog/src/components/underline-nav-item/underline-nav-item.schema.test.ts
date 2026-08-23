import {describe, it, expect} from 'vitest';
import {UnderlineNavItemApi} from './underline-nav-item.schema';

describe('UnderlineNavItemApi.schema', () => {
  it('accepts a minimal valid item (text only)', () => {
    expect(UnderlineNavItemApi.schema.safeParse({text: 'Code'}).success).toBe(true);
  });

  it('accepts the full prop surface', () => {
    expect(
      UnderlineNavItemApi.schema.safeParse({
        text: 'Issues',
        action: {event: {name: 'select', context: {tab: 'issues'}}},
        href: '#/issues',
        'aria-current': 'page',
        leadingVisual: 'glyph',
        counter: '12',
      }).success,
    ).toBe(true);
  });

  it('accepts a functionCall action', () => {
    expect(
      UnderlineNavItemApi.schema.safeParse({
        text: 'Run local',
        action: {functionCall: {call: 'consoleLog', args: {message: 'hi'}, returnType: 'void'}},
      }).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(UnderlineNavItemApi.schema.safeParse({href: '#/code'}).success).toBe(false);
  });

  it('rejects an out-of-enum aria-current', () => {
    expect(
      UnderlineNavItemApi.schema.safeParse({text: 'Code', 'aria-current': 'active'}).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(UnderlineNavItemApi.schema.safeParse({text: 'Code', as: 'a'}).success).toBe(false);
  });

  it('accepts a path-bound text (DynamicString)', () => {
    expect(UnderlineNavItemApi.schema.safeParse({text: {path: '/label'}}).success).toBe(true);
  });

  it('accepts a path-bound counter (DynamicString)', () => {
    expect(
      UnderlineNavItemApi.schema.safeParse({text: 'Issues', counter: {path: '/count'}}).success,
    ).toBe(true);
  });
});
