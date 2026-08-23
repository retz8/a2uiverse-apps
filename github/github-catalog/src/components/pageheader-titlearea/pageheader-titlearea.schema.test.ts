import {describe, it, expect} from 'vitest';
import {PageHeaderTitleAreaApi} from './pageheader-titlearea.schema';

describe('PageHeaderTitleAreaApi.schema', () => {
  it('accepts a minimal valid TitleArea (every prop optional)', () => {
    expect(PageHeaderTitleAreaApi.schema.safeParse({}).success).toBe(true);
  });

  it('accepts a full-surface TitleArea', () => {
    expect(
      PageHeaderTitleAreaApi.schema.safeParse({children: ['a'], variant: 'large', hidden: false})
        .success,
    ).toBe(true);
  });

  it('accepts a responsive object for variant', () => {
    expect(
      PageHeaderTitleAreaApi.schema.safeParse({variant: {narrow: 'subtitle', regular: 'medium'}})
        .success,
    ).toBe(true);
  });

  it('accepts a dynamic-template ChildList', () => {
    expect(
      PageHeaderTitleAreaApi.schema.safeParse({children: {componentId: 'tpl', path: '/items'}})
        .success,
    ).toBe(true);
  });

  it('rejects an out-of-enum variant', () => {
    expect(PageHeaderTitleAreaApi.schema.safeParse({variant: 'huge'}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(PageHeaderTitleAreaApi.schema.safeParse({color: 'red'}).success).toBe(false);
  });
});
