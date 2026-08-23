import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PopoverView} from './popover';

afterEach(cleanup);

describe('PopoverView', () => {
  it('renders its content when open', () => {
    render(
      <PopoverView open relative>
        <span>Popover body</span>
      </PopoverView>,
    );
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const {container} = render(
      <PopoverView open>
        <span>body</span>
      </PopoverView>,
    );
    expect(container.querySelector('[data-component="Popover"]')?.tagName).toBe('DIV');
  });

  it('honours the as prop (semantic wrapper element)', () => {
    const {container} = render(
      <PopoverView open as="section">
        <span>body</span>
      </PopoverView>,
    );
    const wrapper = container.querySelector('[data-component="Popover"]');
    expect(wrapper?.tagName).toBe('SECTION');
  });

  it('renders an aside wrapper for as=aside', () => {
    const {container} = render(
      <PopoverView open as="aside">
        <span>body</span>
      </PopoverView>,
    );
    expect(container.querySelector('[data-component="Popover"]')?.tagName).toBe('ASIDE');
  });

  it('stamps data-open and shows the wrapper when open', () => {
    const {container} = render(
      <PopoverView open>
        <span>body</span>
      </PopoverView>,
    );
    const wrapper = container.querySelector('[data-component="Popover"]') as HTMLElement;
    expect(wrapper).toHaveAttribute('data-open', '');
    expect(wrapper.style.display).toBe('block');
  });

  it('hides the wrapper and omits data-open when closed', () => {
    const {container} = render(
      <PopoverView open={false}>
        <span>body</span>
      </PopoverView>,
    );
    const wrapper = container.querySelector('[data-component="Popover"]') as HTMLElement;
    expect(wrapper).not.toHaveAttribute('data-open');
    expect(wrapper.style.display).toBe('none');
  });

  it('reflects relative through data-relative (in-flow positioning)', () => {
    const {container} = render(
      <PopoverView open relative>
        <span>body</span>
      </PopoverView>,
    );
    const wrapper = container.querySelector('[data-component="Popover"]') as HTMLElement;
    expect(wrapper).toHaveAttribute('data-relative', '');
    expect(wrapper.style.position).toBe('relative');
  });

  it('positions absolutely and omits data-relative by default', () => {
    const {container} = render(
      <PopoverView open>
        <span>body</span>
      </PopoverView>,
    );
    const wrapper = container.querySelector('[data-component="Popover"]') as HTMLElement;
    expect(wrapper).not.toHaveAttribute('data-relative');
    expect(wrapper.style.position).toBe('absolute');
  });

  it('defaults the caret to top and reflects an explicit caret', () => {
    const {container: defaultCaret} = render(
      <PopoverView open>
        <span>body</span>
      </PopoverView>,
    );
    expect(defaultCaret.querySelector('[data-component="Popover"]')).toHaveAttribute(
      'data-caret',
      'top',
    );
    cleanup();
    const {container: explicit} = render(
      <PopoverView open caret="bottom-right">
        <span>body</span>
      </PopoverView>,
    );
    expect(explicit.querySelector('[data-component="Popover"]')).toHaveAttribute(
      'data-caret',
      'bottom-right',
    );
  });
});
