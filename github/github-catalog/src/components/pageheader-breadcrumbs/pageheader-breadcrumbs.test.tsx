import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderBreadcrumbsView} from './pageheader-breadcrumbs';

afterEach(cleanup);

describe('PageHeaderBreadcrumbsView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderBreadcrumbsView>
        <span>Child</span>
      </PageHeaderBreadcrumbsView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderBreadcrumbsView hidden>
        <span>x</span>
      </PageHeaderBreadcrumbsView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
