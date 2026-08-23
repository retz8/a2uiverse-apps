import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {Breadcrumbs as PrimerBreadcrumbs} from '@primer/react';
import {BreadcrumbsView} from './breadcrumbs';

afterEach(cleanup);

describe('BreadcrumbsView', () => {
  it('renders its crumb children inside a navigation trail', () => {
    render(
      <BreadcrumbsView>
        <PrimerBreadcrumbs.Item href="/">Home</PrimerBreadcrumbs.Item>
        <PrimerBreadcrumbs.Item href="/repos">Repositories</PrimerBreadcrumbs.Item>
      </BreadcrumbsView>,
    );
    expect(screen.getByRole('link', {name: 'Home'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Repositories'})).toBeInTheDocument();
  });

  it('renders a nav landmark with the hardcoded Breadcrumbs label', () => {
    const {container} = render(
      <BreadcrumbsView>
        <PrimerBreadcrumbs.Item href="/">Home</PrimerBreadcrumbs.Item>
      </BreadcrumbsView>,
    );
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumbs');
  });

  it('emits the overflow mode on the nav (data-overflow)', () => {
    const {container} = render(
      <BreadcrumbsView overflow="menu-with-root">
        <PrimerBreadcrumbs.Item href="/">Home</PrimerBreadcrumbs.Item>
      </BreadcrumbsView>,
    );
    expect(container.querySelector('nav')).toHaveAttribute('data-overflow', 'menu-with-root');
  });

  it('emits the variant on the nav (data-variant)', () => {
    const {container} = render(
      <BreadcrumbsView variant="spacious">
        <PrimerBreadcrumbs.Item href="/">Home</PrimerBreadcrumbs.Item>
      </BreadcrumbsView>,
    );
    expect(container.querySelector('nav')).toHaveAttribute('data-variant', 'spacious');
  });
});
