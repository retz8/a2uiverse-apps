import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {BreadcrumbsItemView} from './breadcrumbsitem';

afterEach(cleanup);

describe('BreadcrumbsItemView', () => {
  it('renders the crumb label as an anchor carrying the href', () => {
    render(<BreadcrumbsItemView label="Repositories" href="/repos" />);
    const el = screen.getByRole('link', {name: 'Repositories'});
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', '/repos');
  });

  it('marks the selected crumb as the current page (aria-current)', () => {
    const {container} = render(<BreadcrumbsItemView label="Settings" selected />);
    const el = container.querySelector('[data-component="Breadcrumbs.Item"]');
    expect(el).toHaveAttribute('aria-current', 'page');
  });

  it('opens in a new tab when target is _blank', () => {
    render(<BreadcrumbsItemView label="External" href="https://example.com" target="_blank" />);
    expect(screen.getByRole('link', {name: 'External'})).toHaveAttribute('target', '_blank');
  });

  it('exposes an accessible label/description to assistive tech', () => {
    render(
      <BreadcrumbsItemView
        label="Home"
        href="/"
        accessibility={{label: 'Return to the home page', description: 'Top of the hierarchy'}}
      />,
    );
    const el = screen.getByRole('link', {name: 'Return to the home page'});
    expect(el).toHaveAttribute('aria-label', 'Return to the home page');
    expect(el).toHaveAttribute('aria-description', 'Top of the hierarchy');
  });
});
