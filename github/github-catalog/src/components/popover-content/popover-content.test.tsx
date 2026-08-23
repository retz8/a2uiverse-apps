import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {PopoverContentView} from './popover-content';

afterEach(cleanup);

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

const box = (c: HTMLElement) =>
  c.querySelector('[data-component="Popover.Content"]') as HTMLElement;

describe('PopoverContentView', () => {
  it('renders its content', () => {
    renderInTheme(
      <PopoverContentView>
        <span>Click outside to dismiss</span>
      </PopoverContentView>,
    );
    expect(screen.getByText('Click outside to dismiss')).toBeInTheDocument();
  });

  it('defaults width/height and reflects explicit values through data-width/data-height', () => {
    const {container: defaults} = renderInTheme(
      <PopoverContentView>
        <span>body</span>
      </PopoverContentView>,
    );
    expect(box(defaults)).toHaveAttribute('data-width', 'small');
    expect(box(defaults)).toHaveAttribute('data-height', 'fit-content');
    cleanup();
    const {container: explicit} = renderInTheme(
      <PopoverContentView width="medium" height="large">
        <span>body</span>
      </PopoverContentView>,
    );
    expect(box(explicit)).toHaveAttribute('data-width', 'medium');
    expect(box(explicit)).toHaveAttribute('data-height', 'large');
  });

  it('applies overflow as an inline style', () => {
    const {container} = renderInTheme(
      <PopoverContentView overflow="scroll">
        <span>body</span>
      </PopoverContentView>,
    );
    expect(box(container).style.overflow).toBe('scroll');
  });

  it('emits authored aria-* attributes on the content box', () => {
    const {container} = renderInTheme(
      <PopoverContentView
        accessibility={{label: 'Notice', description: 'Click outside to dismiss'}}
      >
        <span>body</span>
      </PopoverContentView>,
    );
    expect(box(container)).toHaveAttribute('aria-label', 'Notice');
    expect(box(container)).toHaveAttribute('aria-description', 'Click outside to dismiss');
  });

  it('fires onClickOutside when a click occurs outside the box', () => {
    const onClickOutside = vi.fn();
    renderInTheme(
      <PopoverContentView onClickOutside={onClickOutside}>
        <span>body</span>
      </PopoverContentView>,
    );
    fireEvent.mouseDown(document.body);
    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClickOutside for a click inside the box', () => {
    const onClickOutside = vi.fn();
    renderInTheme(
      <PopoverContentView onClickOutside={onClickOutside}>
        <span>inside</span>
      </PopoverContentView>,
    );
    fireEvent.mouseDown(screen.getByText('inside'));
    expect(onClickOutside).not.toHaveBeenCalled();
  });
});
