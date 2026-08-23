import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {SplitPageLayoutHeaderView} from './split-page-layout-header';

afterEach(cleanup);

const headerEl = (c: HTMLElement) => c.querySelector('[data-component="SplitPageLayout.Header"]');

describe('SplitPageLayoutHeaderView', () => {
  it('renders the header region and its children', () => {
    const {container} = render(
      <SplitPageLayoutHeaderView>
        <span>Repository settings</span>
      </SplitPageLayoutHeaderView>,
    );
    expect(headerEl(container)).not.toBeNull();
    expect(screen.getByText('Repository settings')).toBeInTheDocument();
  });

  it('forwards padding as the region spacing token', () => {
    const {container} = render(
      <SplitPageLayoutHeaderView padding="condensed">
        <span>x</span>
      </SplitPageLayoutHeaderView>,
    );
    expect(container.innerHTML).toContain('--spacing-condensed');
  });

  it('renders the edge divider with the resolved variant', () => {
    const {container} = render(
      <SplitPageLayoutHeaderView divider="line">
        <span>x</span>
      </SplitPageLayoutHeaderView>,
    );
    const divider = container.querySelector('[data-component="PageLayout.HorizontalDivider"]');
    expect(divider).toHaveAttribute('data-variant', 'line');
  });

  it('forwards a scalar hidden as a data attribute (region hidden)', () => {
    const {container} = render(
      <SplitPageLayoutHeaderView hidden={true}>
        <span>x</span>
      </SplitPageLayoutHeaderView>,
    );
    expect(headerEl(container)).toHaveAttribute('data-hidden', 'true');
  });

  it('applies the accessibility label as aria-label on the header landmark', () => {
    const {container} = render(
      <SplitPageLayoutHeaderView accessibility={{label: 'Page header'}}>
        <span>x</span>
      </SplitPageLayoutHeaderView>,
    );
    expect(headerEl(container)).toHaveAttribute('aria-label', 'Page header');
  });
});
