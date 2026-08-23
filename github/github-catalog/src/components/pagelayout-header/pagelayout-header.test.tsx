import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageLayoutHeaderView} from './pagelayout-header';

afterEach(cleanup);

describe('PageLayoutHeaderView', () => {
  it('renders its children inside the banner landmark', () => {
    render(
      <PageLayoutHeaderView>
        <span>Repositories</span>
      </PageLayoutHeaderView>,
    );
    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('Repositories').closest('header')).toHaveAttribute(
      'data-component',
      'PageLayout.Header',
    );
  });

  it('applies the accessibility label as aria-label on the banner', () => {
    render(
      <PageLayoutHeaderView accessibility={{label: 'Site header'}}>
        <span>Repositories</span>
      </PageLayoutHeaderView>,
    );
    expect(screen.getByText('Repositories').closest('header')).toHaveAttribute(
      'aria-label',
      'Site header',
    );
  });

  it('renders with a responsive hidden value without error', () => {
    render(
      <PageLayoutHeaderView hidden={{narrow: true, regular: false}}>
        <span>Repositories</span>
      </PageLayoutHeaderView>,
    );
    expect(screen.getByText('Repositories')).toBeInTheDocument();
  });
});
