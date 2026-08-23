import {describe, it, expect, afterEach, vi} from 'vitest';
import {render, cleanup, act} from '@testing-library/react';
import {SkeletonBoxView} from './skeletonbox';

afterEach(cleanup);

describe('SkeletonBoxView', () => {
  it('renders a placeholder box', () => {
    const {container} = render(<SkeletonBoxView />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('applies height and width as inline styles', () => {
    const {container} = render(<SkeletonBoxView height="80px" width="200px" />);
    const box = container.querySelector('div')!;
    expect(box.style.height).toBe('80px');
    expect(box.style.width).toBe('200px');
  });

  it('renders immediately for the default (no delay)', () => {
    const {container} = render(<SkeletonBoxView />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders immediately for the explicit none delay', () => {
    const {container} = render(<SkeletonBoxView delay="none" />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('defers a short delay: absent at t0, present after 300ms', () => {
    vi.useFakeTimers();
    try {
      const {container} = render(<SkeletonBoxView delay="short" />);
      expect(container.querySelector('div')).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(container.querySelector('div')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
