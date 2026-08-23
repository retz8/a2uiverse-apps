import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderView} from './pageheader';

afterEach(cleanup);

describe('PageHeaderView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderView>
        <span>Body</span>
      </PageHeaderView>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const {container} = render(
      <PageHeaderView>
        <span>x</span>
      </PageHeaderView>,
    );
    expect(container.querySelector('div[data-component="PageHeader"]')).toBeInTheDocument();
  });

  it('renders as the given element (header)', () => {
    const {container} = render(
      <PageHeaderView as="header">
        <span>x</span>
      </PageHeaderView>,
    );
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('forwards role', () => {
    const {container} = render(
      <PageHeaderView role="banner">
        <span>x</span>
      </PageHeaderView>,
    );
    expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
  });

  it('forwards aria-label and hasBorder', () => {
    const {container} = render(
      <PageHeaderView ariaLabel="Page header" hasBorder>
        <span>x</span>
      </PageHeaderView>,
    );
    expect(container.querySelector('[aria-label="Page header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-has-border="true"]')).toBeInTheDocument();
  });
});
