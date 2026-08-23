import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageLayoutPaneView} from './pagelayout-pane';

afterEach(cleanup);

describe('PageLayoutPaneView', () => {
  it('renders its children inside the pane region', () => {
    // Primer gates the pane's region role + aria-label on runtime overflow detection (which jsdom
    // cannot measure), so the labelled region is confirmed by live review; here we assert the
    // pane content renders.
    render(
      <PageLayoutPaneView accessibility={{label: 'Details pane'}}>
        <span>Pane body</span>
      </PageLayoutPaneView>,
    );
    expect(screen.getByText('Pane body')).toBeInTheDocument();
  });

  it('renders a resize handle when resizable', () => {
    render(
      <PageLayoutPaneView resizable accessibility={{label: 'Details pane'}}>
        <span>Pane body</span>
      </PageLayoutPaneView>,
    );
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders in controlled mode when currentWidth is bound (setter present)', () => {
    // A bound currentWidth arrives with its auto-generated setter; the view then drives Primer's
    // controlled resize (onResizeEnd write-back). The drag itself is verified by live review.
    const setCurrentWidth = () => {};
    render(
      <PageLayoutPaneView
        resizable
        currentWidth={320}
        setCurrentWidth={setCurrentWidth}
        accessibility={{label: 'Details pane'}}
      >
        <span>Pane body</span>
      </PageLayoutPaneView>,
    );
    expect(screen.getByText('Pane body')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
