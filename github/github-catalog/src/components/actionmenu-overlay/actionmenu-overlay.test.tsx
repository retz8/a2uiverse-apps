import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionMenu as PrimerActionMenu, ActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionMenuOverlayView, mapVariant} from './actionmenu-overlay';

afterEach(cleanup);

// The overlay reads the parent ActionMenu's context (anchor + open state), so it is exercised inside
// an open, controlled menu — the real composition it ships in.
function renderInOpenMenu(overlay: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionMenu open onOpenChange={() => {}}>
          <PrimerActionMenu.Button>Actions</PrimerActionMenu.Button>
          {overlay}
        </PrimerActionMenu>
      </BaseStyles>
    </ThemeProvider>,
  );
}

const menuContent = (
  <ActionList>
    <ActionList.Item>View pull request</ActionList.Item>
  </ActionList>
);

describe('ActionMenuOverlayView', () => {
  it('renders the menu content when the parent menu is open', () => {
    renderInOpenMenu(<ActionMenuOverlayView>{menuContent}</ActionMenuOverlayView>);
    expect(screen.getByText('View pull request')).toBeInTheDocument();
  });

  it('smoke-renders the positioning and sizing props', () => {
    renderInOpenMenu(
      <ActionMenuOverlayView
        side="outside-top"
        align="center"
        width="large"
        height="medium"
        maxHeight="small"
        maxWidth="xlarge"
        displayInViewport
      >
        {menuContent}
      </ActionMenuOverlayView>,
    );
    expect(screen.getByText('View pull request')).toBeInTheDocument();
  });
});

describe('mapVariant', () => {
  it("maps 'fullscreen' to the responsive object with the narrow arm set", () => {
    expect(mapVariant('fullscreen')).toEqual({regular: 'anchored', narrow: 'fullscreen'});
  });

  it("maps 'anchored' to the responsive object with the narrow arm set", () => {
    expect(mapVariant('anchored')).toEqual({regular: 'anchored', narrow: 'anchored'});
  });

  it('passes undefined through so Primer applies its own default', () => {
    expect(mapVariant(undefined)).toBeUndefined();
  });
});
