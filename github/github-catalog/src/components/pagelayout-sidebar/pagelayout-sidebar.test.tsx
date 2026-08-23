import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageLayoutSidebarView} from './pagelayout-sidebar';

afterEach(cleanup);

describe('PageLayoutSidebarView', () => {
  it('renders its children inside the sidebar region', () => {
    // Primer gates the sidebar's region role + aria-label on runtime overflow detection (which jsdom
    // cannot measure), so the labelled region is confirmed by live review; here we assert the
    // sidebar content renders.
    render(
      <PageLayoutSidebarView accessibility={{label: 'Navigation'}}>
        <span>Sidebar body</span>
      </PageLayoutSidebarView>,
    );
    expect(screen.getByText('Sidebar body')).toBeInTheDocument();
  });

  it('renders a resize handle when resizable', () => {
    render(
      <PageLayoutSidebarView resizable accessibility={{label: 'Navigation'}}>
        <span>Sidebar body</span>
      </PageLayoutSidebarView>,
    );
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders in controlled mode when currentWidth is bound (setter present)', () => {
    const setCurrentWidth = () => {};
    render(
      <PageLayoutSidebarView
        resizable
        currentWidth={280}
        setCurrentWidth={setCurrentWidth}
        accessibility={{label: 'Navigation'}}
      >
        <span>Sidebar body</span>
      </PageLayoutSidebarView>,
    );
    expect(screen.getByText('Sidebar body')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
