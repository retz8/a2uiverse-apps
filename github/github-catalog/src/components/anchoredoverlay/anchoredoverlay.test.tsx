import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {AnchoredOverlayView, mapVariant} from './anchoredoverlay';

afterEach(cleanup);

// AnchoredOverlay portals its panel to the document body and manages its own focus trap, so a
// ThemeProvider frame is enough — no host container needed.
function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

const trigger = <button type="button">Open panel</button>;

describe('AnchoredOverlayView', () => {
  it('renders the trigger and, when open, the panel content', () => {
    renderInTheme(
      <AnchoredOverlayView anchor={trigger} open>
        <span>Panel content</span>
      </AnchoredOverlayView>,
    );
    expect(screen.getByRole('button', {name: 'Open panel'})).toBeInTheDocument();
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('renders only the trigger when open is false — the panel is absent from the DOM', () => {
    renderInTheme(
      <AnchoredOverlayView anchor={trigger} open={false}>
        <span>Panel content</span>
      </AnchoredOverlayView>,
    );
    expect(screen.getByRole('button', {name: 'Open panel'})).toBeInTheDocument();
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });

  it('open gesture: clicking the trigger writes back setOpen(true), fires onOpen, and shows the panel', () => {
    const setOpen = vi.fn();
    const onOpen = vi.fn();
    renderInTheme(
      <AnchoredOverlayView anchor={trigger} open={false} setOpen={setOpen} onOpen={onOpen}>
        <span>Panel content</span>
      </AnchoredOverlayView>,
    );
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Open panel'}));
    expect(setOpen).toHaveBeenCalledWith(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('close gesture: pressing Escape while open writes back setOpen(false), fires onClose, and hides the panel', () => {
    const setOpen = vi.fn();
    const onClose = vi.fn();
    renderInTheme(
      <AnchoredOverlayView anchor={trigger} open setOpen={setOpen} onClose={onClose}>
        <span>Panel content</span>
      </AnchoredOverlayView>,
    );
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    fireEvent.keyDown(document.body, {key: 'Escape', code: 'Escape'});
    expect(setOpen).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });

  it('close gesture: re-clicking the trigger while open closes the panel', () => {
    const setOpen = vi.fn();
    const onClose = vi.fn();
    renderInTheme(
      <AnchoredOverlayView anchor={trigger} open setOpen={setOpen} onClose={onClose}>
        <span>Panel content</span>
      </AnchoredOverlayView>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Open panel'}));
    expect(setOpen).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is controlled by open — reopens when open returns to true', () => {
    const frame = (open: boolean) => (
      <ThemeProvider>
        <BaseStyles>
          <AnchoredOverlayView anchor={trigger} open={open}>
            <span>Panel content</span>
          </AnchoredOverlayView>
        </BaseStyles>
      </ThemeProvider>
    );
    const {rerender} = render(frame(true));
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    rerender(frame(false));
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    rerender(frame(true));
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('smoke-renders the deferred behavior/visual props (displayInViewport, preventOverflow, pinPosition, displayCloseButton)', () => {
    renderInTheme(
      <AnchoredOverlayView
        anchor={trigger}
        open
        displayInViewport
        preventOverflow
        pinPosition
        displayCloseButton
      >
        <span>Panel content</span>
      </AnchoredOverlayView>,
    );
    expect(screen.getByText('Panel content')).toBeInTheDocument();
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
