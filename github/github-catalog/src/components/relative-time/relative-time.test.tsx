import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup, waitFor} from '@testing-library/react';
import {RelativeTimeView} from './relative-time';

afterEach(cleanup);

// A fixed instant three days before "now", coarse enough that the rendered text cannot tick
// between the render and the assertion.
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

describe('RelativeTimeView', () => {
  it('renders a relative-time element carrying the datetime and formatted text', () => {
    const {container} = render(<RelativeTimeView datetime={threeDaysAgo} />);
    const el = container.querySelector('relative-time');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('datetime')).toBe(threeDaysAgo);
    expect(el?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  // The element applies attribute changes in a microtask-batched update(), so title
  // assertions must wait for that update to settle.
  it('carries the full-date title tooltip by default', async () => {
    const {container} = render(<RelativeTimeView datetime={threeDaysAgo} />);
    await waitFor(() =>
      expect(container.querySelector('relative-time')?.hasAttribute('title')).toBe(true),
    );
  });

  it('suppresses the title tooltip when noTitle is set', async () => {
    const {container} = render(<RelativeTimeView datetime={threeDaysAgo} noTitle />);
    const el = container.querySelector('relative-time');
    // Settle the batched update (it always writes the display text) …
    await waitFor(() => expect(el?.textContent?.trim().length ?? 0).toBeGreaterThan(0));
    // … then assert the tooltip stayed suppressed.
    expect(el?.hasAttribute('title')).toBe(false);
  });

  it('forwards a set prop onto the element and omits unset ones', () => {
    const {container} = render(<RelativeTimeView datetime={threeDaysAgo} format="datetime" />);
    const el = container.querySelector('relative-time');
    expect(el?.getAttribute('format')).toBe('datetime');
    // Unset optional props are not forwarded (no literal "undefined" attributes).
    expect(el?.hasAttribute('tense')).toBe(false);
  });
});
