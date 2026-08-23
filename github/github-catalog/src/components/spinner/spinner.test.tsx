import {describe, it, expect, afterEach, beforeAll, vi} from 'vitest';
import {render, screen, cleanup, act} from '@testing-library/react';
import {SpinnerView} from './spinner';

// Primer Spinner reads `prefers-reduced-motion` via useMedia → window.matchMedia,
// which jsdom does not implement. Stub it so the animation-sync effect is a no-op.
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }
});

afterEach(cleanup);

describe('SpinnerView', () => {
  it('renders the built-in "Loading" hidden text by default', () => {
    render(<SpinnerView />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('renders a literal srText as the visually-hidden label', () => {
    render(<SpinnerView srText="Fetching results" />);
    expect(screen.getByText('Fetching results')).toBeInTheDocument();
  });

  it('renders no hidden text when srText is null', () => {
    render(<SpinnerView srText={null} />);
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('sizes the spinner svg per the size enum', () => {
    const {container: small} = render(<SpinnerView size="small" />);
    expect(small.querySelector('svg')).toHaveAttribute('width', '16px');
    cleanup();
    const {container: large} = render(<SpinnerView size="large" />);
    expect(large.querySelector('svg')).toHaveAttribute('width', '64px');
  });

  it('delays becoming visible when delay is "short"', () => {
    vi.useFakeTimers();
    try {
      const {container} = render(<SpinnerView delay="short" />);
      // Absent at t0 — Spinner returns null until the delay elapses.
      expect(container.querySelector('svg')).toBeNull();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(container.querySelector('svg')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders immediately when delay is "none"', () => {
    const {container} = render(<SpinnerView delay="none" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
