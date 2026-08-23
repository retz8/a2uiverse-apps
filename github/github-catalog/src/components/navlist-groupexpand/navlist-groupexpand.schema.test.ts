import {describe, it, expect} from 'vitest';
import {NavListGroupExpandApi} from './navlist-groupexpand.schema';

const minimal = {items: [{text: 'api'}], label: 'Show more'};

describe('NavListGroupExpandApi.schema', () => {
  it('accepts a minimal valid GroupExpand (items + label)', () => {
    expect(NavListGroupExpandApi.schema.safeParse(minimal).success).toBe(true);
  });

  it('accepts the full item and prop surface', () => {
    const result = NavListGroupExpandApi.schema.safeParse({
      label: 'Show more repositories',
      pages: 2,
      items: [
        {text: 'api', leadingVisual: 'repo', href: '#'},
        {text: 'web', leadingVisual: 'repo', trailingVisual: '3', href: '#'},
        {
          text: 'docs',
          leadingVisual: 'repo',
          href: '#',
          ariaCurrent: 'page',
          defaultOpen: true,
          inactiveText: 'n/a',
          trailingAction: {
            icon: 'pin',
            label: 'Pin docs',
            action: {functionCall: {call: 'consoleLog', args: {message: 'pin docs'}}},
            loading: false,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('requires items', () => {
    expect(NavListGroupExpandApi.schema.safeParse({label: 'Show more'}).success).toBe(false);
  });

  it('requires label', () => {
    expect(NavListGroupExpandApi.schema.safeParse({items: [{text: 'api'}]}).success).toBe(false);
  });

  it('requires text on each item', () => {
    expect(NavListGroupExpandApi.schema.safeParse({items: [{href: '#'}], label: 'x'}).success).toBe(
      false,
    );
  });

  it('rejects an out-of-enum leadingVisual (must be an octicon name)', () => {
    expect(
      NavListGroupExpandApi.schema.safeParse({
        items: [{text: 'api', leadingVisual: 'not-an-icon'}],
        label: 'x',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(NavListGroupExpandApi.schema.safeParse({...minimal, renderItem: 'fn'}).success).toBe(
      false,
    );
  });

  it('rejects unknown props on an item (strict)', () => {
    expect(
      NavListGroupExpandApi.schema.safeParse({items: [{text: 'api', as: 'a'}], label: 'x'}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for label (DynamicString)', () => {
    expect(
      NavListGroupExpandApi.schema.safeParse({items: [{text: 'api'}], label: {path: '/label'}})
        .success,
    ).toBe(true);
  });

  it('accepts a data-binding for an item text (DynamicString)', () => {
    expect(
      NavListGroupExpandApi.schema.safeParse({items: [{text: {path: '/t'}}], label: 'x'}).success,
    ).toBe(true);
  });
});
