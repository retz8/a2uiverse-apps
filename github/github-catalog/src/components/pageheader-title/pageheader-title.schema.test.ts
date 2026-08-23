import {describe, it, expect} from 'vitest';
import {PageHeaderTitleApi} from './pageheader-title.schema';

describe('PageHeaderTitleApi.schema', () => {
  it('accepts a minimal valid Title (text)', () => {
    expect(PageHeaderTitleApi.schema.safeParse({text: 'Pull request #42'}).success).toBe(true);
  });

  it('accepts a full-surface Title', () => {
    expect(
      PageHeaderTitleApi.schema.safeParse({text: 'Title', as: 'h1', hidden: true}).success,
    ).toBe(true);
  });

  it('requires text', () => {
    expect(PageHeaderTitleApi.schema.safeParse({as: 'h1'}).success).toBe(false);
  });

  it('rejects an out-of-enum as', () => {
    expect(PageHeaderTitleApi.schema.safeParse({text: 'x', as: 'h7'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderTitleApi.schema.safeParse({text: 'x', color: 'red'}).success).toBe(false);
  });

  it('accepts a data-binding for text (DynamicString)', () => {
    expect(PageHeaderTitleApi.schema.safeParse({text: {path: '/title'}}).success).toBe(true);
  });
});
