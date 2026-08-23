import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {SplitPageLayoutFooterView} from './split-page-layout-footer';

afterEach(cleanup);

const footerEl = (c: HTMLElement) => c.querySelector('[data-component="SplitPageLayout.Footer"]');

describe('SplitPageLayoutFooterView', () => {
  it('renders the footer region and its children', () => {
    const {container} = render(
      <SplitPageLayoutFooterView>
        <span>© 2026 GitHub</span>
      </SplitPageLayoutFooterView>,
    );
    expect(footerEl(container)).not.toBeNull();
    expect(screen.getByText('© 2026 GitHub')).toBeInTheDocument();
  });

  it('forwards padding as the region spacing token', () => {
    const {container} = render(
      <SplitPageLayoutFooterView padding="condensed">
        <span>x</span>
      </SplitPageLayoutFooterView>,
    );
    expect(container.innerHTML).toContain('--spacing-condensed');
  });

  it('renders the edge divider with the resolved variant', () => {
    const {container} = render(
      <SplitPageLayoutFooterView divider="line">
        <span>x</span>
      </SplitPageLayoutFooterView>,
    );
    const divider = container.querySelector('[data-component="PageLayout.HorizontalDivider"]');
    expect(divider).toHaveAttribute('data-variant', 'line');
  });

  it('forwards a scalar hidden as a data attribute (region hidden)', () => {
    const {container} = render(
      <SplitPageLayoutFooterView hidden={true}>
        <span>x</span>
      </SplitPageLayoutFooterView>,
    );
    expect(footerEl(container)).toHaveAttribute('data-hidden', 'true');
  });

  it('applies the accessibility label as aria-label on the footer landmark', () => {
    const {container} = render(
      <SplitPageLayoutFooterView accessibility={{label: 'Page footer'}}>
        <span>x</span>
      </SplitPageLayoutFooterView>,
    );
    expect(footerEl(container)).toHaveAttribute('aria-label', 'Page footer');
  });
});
