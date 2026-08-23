import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {UnderlineNavItemView} from './underline-nav-item';

afterEach(cleanup);

describe('UnderlineNavItemView', () => {
  it('renders its text as the tab label', () => {
    render(<UnderlineNavItemView text="Code" />);
    expect(screen.getByRole('link', {name: /Code/})).toBeInTheDocument();
  });

  it('forwards href to the tab anchor', () => {
    render(<UnderlineNavItemView text="Issues" href="#/issues" />);
    expect(screen.getByRole('link', {name: /Issues/})).toHaveAttribute('href', '#/issues');
  });

  it('marks the current tab via aria-current', () => {
    render(<UnderlineNavItemView text="Code" ariaCurrent="page" />);
    expect(screen.getByRole('link', {name: /Code/})).toHaveAttribute('aria-current', 'page');
  });

  it('fires onSelect when clicked (the resolved action)', () => {
    const onSelect = vi.fn();
    render(<UnderlineNavItemView text="Pull requests" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('link', {name: /Pull requests/}));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders a trailing counter', () => {
    render(<UnderlineNavItemView text="Issues" counter="12" />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders a leadingVisual alongside the label', () => {
    render(<UnderlineNavItemView text="Code" leadingVisual={<span data-testid="lv">LV</span>} />);
    expect(screen.getByTestId('lv')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /Code/})).toBeInTheDocument();
  });
});
