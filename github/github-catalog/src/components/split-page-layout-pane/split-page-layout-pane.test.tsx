import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {SplitPageLayoutPaneView} from './split-page-layout-pane';

afterEach(cleanup);

/** Every Pane render needs an accessibility label to avoid Primer's overflow warning. */
const label = {label: 'Details pane'};

describe('SplitPageLayoutPaneView', () => {
  it('renders the pane region and its children', () => {
    const {container} = render(
      <SplitPageLayoutPaneView accessibility={label}>
        <span>Pane body</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.querySelector('[data-component="SplitPageLayout.Pane"]')).not.toBeNull();
    expect(screen.getByText('Pane body')).toBeInTheDocument();
  });

  it('forwards the pane position as a data attribute', () => {
    const {container} = render(
      <SplitPageLayoutPaneView position="end" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.querySelector('[data-position="end"]')).not.toBeNull();
  });

  it('forwards a named width as the pane width token', () => {
    const {container} = render(
      <SplitPageLayoutPaneView width="large" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.innerHTML).toContain('--pane-width-large');
  });

  it('forwards a custom min/default/max width', () => {
    const {container} = render(
      <SplitPageLayoutPaneView
        width={{min: '160px', default: '240px', max: '320px'}}
        accessibility={label}
      >
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.innerHTML).toContain('160px');
    expect(container.innerHTML).toContain('320px');
  });

  it('applies the minWidth lower bound', () => {
    const {container} = render(
      <SplitPageLayoutPaneView minWidth={200} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.innerHTML).toContain('200px');
  });

  it('renders the edge divider with the resolved variant', () => {
    const {container} = render(
      <SplitPageLayoutPaneView divider="line" accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    // Pane always passes the divider as a responsive object ({narrow, regular}), so the variant
    // surfaces on the per-viewport `data-variant-regular` attribute rather than a scalar one.
    const divider = container.querySelector('[data-component="PageLayout.VerticalDivider"]');
    expect(divider).toHaveAttribute('data-variant-regular', 'line');
  });

  it('applies a sticky position', () => {
    const {container} = render(
      <SplitPageLayoutPaneView sticky={true} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.querySelector('[data-sticky="true"]')).not.toBeNull();
  });

  it('applies the sticky header offset', () => {
    const {container} = render(
      <SplitPageLayoutPaneView sticky={true} offsetHeader={64} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.innerHTML).toContain('--offset-header');
  });

  it('exposes the resize handle when resizable', () => {
    const {container} = render(
      <SplitPageLayoutPaneView resizable={true} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.querySelector('[data-resizable="true"]')).not.toBeNull();
  });

  it('reflects the controlled currentWidth (two-way bound resize width)', () => {
    const {container} = render(
      <SplitPageLayoutPaneView currentWidth={240} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.innerHTML).toContain('240px');
  });

  it('forwards a scalar hidden as a data attribute (region hidden)', () => {
    const {container} = render(
      <SplitPageLayoutPaneView hidden={true} accessibility={label}>
        <span>x</span>
      </SplitPageLayoutPaneView>,
    );
    expect(container.querySelector('[data-is-hidden="true"]')).not.toBeNull();
  });

  it('applies the accessibility label as aria-label when the pane overflows', () => {
    // Primer surfaces the pane's aria-label only when `useOverflow` detects overflow. jsdom does
    // no layout, so install a ResizeObserver that reports an overflowing target for this render.
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
        <SplitPageLayoutPaneView accessibility={label}>
          <span>x</span>
        </SplitPageLayoutPaneView>,
      );
      expect(container.querySelector('[aria-label="Details pane"]')).not.toBeNull();
    } finally {
      globalThis.ResizeObserver = original;
    }
  });
});
