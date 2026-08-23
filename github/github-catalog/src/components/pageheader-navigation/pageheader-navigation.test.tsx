import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderNavigationView} from './pageheader-navigation';

afterEach(cleanup);

describe('PageHeaderNavigationView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderNavigationView>
        <span>Child</span>
      </PageHeaderNavigationView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const {container} = render(
      <PageHeaderNavigationView>
        <span>x</span>
      </PageHeaderNavigationView>,
    );
    expect(container.querySelector('div[data-component="PH_Navigation"]')).toBeInTheDocument();
  });

  it('renders as a nav landmark when as=nav', () => {
    const {container} = render(
      <PageHeaderNavigationView as="nav" ariaLabel="Tabs">
        <span>x</span>
      </PageHeaderNavigationView>,
    );
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('forwards aria-label and aria-labelledby on the nav landmark', () => {
    const {container} = render(
      <PageHeaderNavigationView as="nav" ariaLabel="Tabs" ariaLabelledby="nav-title">
        <span>x</span>
      </PageHeaderNavigationView>,
    );
    expect(container.querySelector('[aria-label="Tabs"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-labelledby="nav-title"]')).toBeInTheDocument();
  });
});
