import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {PaginationView} from './pagination';

afterEach(cleanup);

describe('PaginationView', () => {
  it('renders numbered page links and marks the current page with aria-current', () => {
    render(<PaginationView pageCount={5} currentPage={3} />);
    expect(screen.getByRole('link', {name: 'Page 1'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Page 3'})).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', {name: 'Page 1'})).not.toHaveAttribute('aria-current');
  });

  it('controlled: calls onPageChange with the clicked page number and preventDefaults', () => {
    const onPageChange = vi.fn();
    render(<PaginationView pageCount={5} currentPage={3} onPageChange={onPageChange} />);
    // fireEvent.click returns false when the event's default was prevented.
    const notPrevented = fireEvent.click(screen.getByRole('link', {name: 'Page 4'}));
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(notPrevented).toBe(false);
  });

  it('uncontrolled: does not intercept the click when no onPageChange is wired', () => {
    render(<PaginationView pageCount={5} currentPage={3} />);
    // No onPageChange -> default is not prevented, so the href would navigate.
    const notPrevented = fireEvent.click(screen.getByRole('link', {name: 'Page 4'}));
    expect(notPrevented).toBe(true);
  });

  it('expands the {page} token in hrefBuilder onto each page link', () => {
    render(<PaginationView pageCount={5} currentPage={1} hrefBuilder="/issues?page={page}" />);
    expect(screen.getByRole('link', {name: 'Page 3'})).toHaveAttribute('href', '/issues?page=3');
  });

  it('uncontrolled: falls back to the default #{page} anchor when no hrefBuilder is given', () => {
    render(<PaginationView pageCount={5} currentPage={1} />);
    expect(screen.getByRole('link', {name: 'Page 3'})).toHaveAttribute('href', '#3');
  });

  it('hides numbered page links when showPages is false (prev/next only)', () => {
    render(<PaginationView pageCount={5} currentPage={3} showPages={false} />);
    expect(screen.queryByRole('link', {name: 'Page 3'})).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Previous Page'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Next Page'})).toBeInTheDocument();
  });

  it('labels the navigation landmark from accessibility.label', () => {
    render(
      <PaginationView pageCount={5} currentPage={3} accessibility={{label: 'Issues pages'}} />,
    );
    expect(screen.getByRole('navigation', {name: 'Issues pages'})).toBeInTheDocument();
  });
});
