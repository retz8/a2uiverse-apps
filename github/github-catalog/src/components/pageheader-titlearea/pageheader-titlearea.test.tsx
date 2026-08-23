import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderTitleAreaView} from './pageheader-titlearea.js';
import {PageHeaderView} from '../pageheader/pageheader.js';

afterEach(cleanup);

describe('PageHeaderTitleAreaView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderTitleAreaView>
        <span>Child</span>
      </PageHeaderTitleAreaView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('renders with a variant selected', () => {
    render(
      <PageHeaderTitleAreaView variant="large">
        <span>Child</span>
      </PageHeaderTitleAreaView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderTitleAreaView hidden>
        <span>x</span>
      </PageHeaderTitleAreaView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});

describe('PageHeaderTitleAreaView inside an A2UI-rendered PageHeader', () => {
  // Primer sizes the title on the PageHeader root by inspecting its *direct* React children for
  // a TitleArea; through the A2UI renderer the direct child is a wrapper, so the leaf has to
  // stamp the size itself.
  it('stamps the title size variant on the PageHeader ancestor', () => {
    const {container} = render(
      <PageHeaderView>
        <div>
          <PageHeaderTitleAreaView variant="large">
            <span>Title</span>
          </PageHeaderTitleAreaView>
        </div>
      </PageHeaderView>,
    );
    const root = container.querySelector('[data-component="PageHeader"]');
    expect(root).toHaveAttribute('data-title-size-variant', 'large');
  });

  it('defaults to medium, and maps a responsive variant per breakpoint', () => {
    const {container} = render(
      <PageHeaderView>
        <div>
          <PageHeaderTitleAreaView variant={{narrow: 'medium', regular: 'large'}}>
            <span>Title</span>
          </PageHeaderTitleAreaView>
        </div>
      </PageHeaderView>,
    );
    const root = container.querySelector('[data-component="PageHeader"]');
    expect(root).toHaveAttribute('data-title-size-variant-narrow', 'medium');
    expect(root).toHaveAttribute('data-title-size-variant-regular', 'large');
    cleanup();
    const second = render(
      <PageHeaderView>
        <div>
          <PageHeaderTitleAreaView>
            <span>Title</span>
          </PageHeaderTitleAreaView>
        </div>
      </PageHeaderView>,
    );
    expect(second.container.querySelector('[data-component="PageHeader"]')).toHaveAttribute(
      'data-title-size-variant',
      'medium',
    );
  });
});
