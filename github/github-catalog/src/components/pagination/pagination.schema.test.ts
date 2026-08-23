import {describe, it, expect} from 'vitest';
import {PaginationApi} from './pagination.schema';

describe('PaginationApi.schema', () => {
  it('accepts a minimal valid Pagination (pageCount + currentPage only)', () => {
    expect(PaginationApi.schema.safeParse({pageCount: 5, currentPage: 3}).success).toBe(true);
  });

  it('accepts the full carried surface', () => {
    expect(
      PaginationApi.schema.safeParse({
        pageCount: 15,
        currentPage: 8,
        marginPageCount: 2,
        showPages: false,
        surroundingPageCount: 4,
        hrefBuilder: '/issues?page={page}',
        accessibility: {label: 'Issues pagination'},
      }).success,
    ).toBe(true);
  });

  it('requires pageCount', () => {
    expect(PaginationApi.schema.safeParse({currentPage: 3}).success).toBe(false);
  });

  it('requires currentPage', () => {
    expect(PaginationApi.schema.safeParse({pageCount: 5}).success).toBe(false);
  });

  it('rejects unknown props (strict)', () => {
    expect(
      PaginationApi.schema.safeParse({pageCount: 5, currentPage: 3, color: 'red'}).success,
    ).toBe(false);
  });

  it('accepts a data-binding for pageCount (DynamicNumber)', () => {
    expect(
      PaginationApi.schema.safeParse({pageCount: {path: '/total'}, currentPage: 3}).success,
    ).toBe(true);
  });

  it('accepts a data-binding for currentPage (DynamicNumber)', () => {
    expect(
      PaginationApi.schema.safeParse({pageCount: 5, currentPage: {path: '/page'}}).success,
    ).toBe(true);
  });
});
