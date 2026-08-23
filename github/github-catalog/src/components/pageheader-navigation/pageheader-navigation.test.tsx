import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderNavigationView} from './pageheader-navigation.js';
import {PageHeaderView} from '../pageheader/pageheader.js';

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

describe('PageHeaderNavigationView inside an A2UI-rendered PageHeader', () => {
  // Primer marks the root `data-has-nav` (and the nav-hidden breakpoints) by inspecting its
  // direct React children; through the A2UI renderer that hoist finds nothing, so a bordered
  // header would draw its own bottom border on top of the navigation's.
  const root = (c: HTMLElement) => c.querySelector('[data-component="PageHeader"]');

  it('marks the PageHeader ancestor as having navigation', () => {
    const {container} = render(
      <PageHeaderView hasBorder>
        <div>
          <PageHeaderNavigationView>
            <span>Nav</span>
          </PageHeaderNavigationView>
        </div>
      </PageHeaderView>,
    );
    expect(root(container)).toHaveAttribute('data-has-nav', '');
    expect(root(container)).not.toHaveAttribute('data-nav-hidden-all');
  });

  it('mirrors a hidden navigation onto the root, scalar and responsive', () => {
    const {container} = render(
      <PageHeaderView hasBorder>
        <div>
          <PageHeaderNavigationView hidden>
            <span>Nav</span>
          </PageHeaderNavigationView>
        </div>
      </PageHeaderView>,
    );
    expect(root(container)).toHaveAttribute('data-nav-hidden-all', 'true');
    cleanup();
    const second = render(
      <PageHeaderView hasBorder>
        <div>
          <PageHeaderNavigationView hidden={{narrow: true, regular: false, wide: false}}>
            <span>Nav</span>
          </PageHeaderNavigationView>
        </div>
      </PageHeaderView>,
    );
    expect(root(second.container)).toHaveAttribute('data-nav-hidden-narrow', 'true');
    expect(root(second.container)).not.toHaveAttribute('data-nav-hidden-regular');
  });
});
