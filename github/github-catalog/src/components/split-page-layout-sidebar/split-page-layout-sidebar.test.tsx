import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {SplitPageLayoutSidebarView} from './split-page-layout-sidebar.js';

afterEach(cleanup);

/** Every Sidebar render needs an accessibility label to avoid Primer's overflow warning. */
const label = {label: 'Navigation sidebar'};

describe('SplitPageLayoutSidebarView', () => {
  it('renders the sidebar region and its children', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView accessibility={label}>
        <span>Sidebar body</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.querySelector('[data-component="SplitPageLayout.Sidebar"]')).not.toBeNull();
    expect(screen.getByText('Sidebar body')).toBeInTheDocument();
  });

  it('forwards the sidebar position as a data attribute', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView position="end" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.querySelector('[data-position="end"]')).not.toBeNull();
  });

  it('forwards a named width as the pane width token', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView width="large" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.innerHTML).toContain('--pane-width-large');
  });

  it('applies the minWidth lower bound', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView minWidth={300} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.innerHTML).toContain('300px');
  });

  it('exposes the resize handle when resizable', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView resizable={true} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.querySelector('[data-resizable="true"]')).not.toBeNull();
  });

  it('reflects the controlled currentWidth (two-way bound resize width)', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView currentWidth={288} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.innerHTML).toContain('288px');
  });

  it('forwards padding as the region spacing token', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView padding="condensed" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.innerHTML).toContain('--spacing-condensed');
  });

  it('renders the edge divider with the resolved variant', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView divider="line" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    const divider = container.querySelector('[data-component="PageLayout.VerticalDivider"]');
    expect(divider).toHaveAttribute('data-variant', 'line');
  });

  it('applies a sticky position', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView sticky={true} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.querySelector('[data-sticky="true"]')).not.toBeNull();
  });

  it('applies the narrow-viewport responsiveVariant', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView responsiveVariant="fullscreen" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.querySelector('[data-responsive-variant="fullscreen"]')).not.toBeNull();
  });

  it('forwards a scalar hidden as a data attribute (region hidden)', () => {
    const {container} = render(
      <SplitPageLayoutSidebarView hidden={true} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutSidebarView>,
    );
    expect(container.querySelector('[data-is-hidden="true"]')).not.toBeNull();
  });

  it('applies the accessibility label as aria-label when the sidebar overflows', () => {
    // Primer surfaces the sidebar's aria-label only when `useOverflow` detects overflow. jsdom
    // does no layout, so install a ResizeObserver that reports an overflowing target for this render.
    const original = globalThis.ResizeObserver;
    class OverflowObserver {
      constructor(private cb: ResizeObserverCallback) {}
      observe() {
        this.cb(
          [
            {
              target: {scrollHeight: 1, clientHeight: 0, scrollWidth: 0, clientWidth: 0},
            } as unknown as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = OverflowObserver as unknown as typeof ResizeObserver;
    try {
      const {container} = render(
        <SplitPageLayoutSidebarView accessibility={label}>
          <span>x</span>
        </SplitPageLayoutSidebarView>,
      );
      expect(container.querySelector('[aria-label="Navigation sidebar"]')).not.toBeNull();
    } finally {
      globalThis.ResizeObserver = original;
    }
  });
});
