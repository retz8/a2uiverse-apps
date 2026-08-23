import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {CounterLabelView} from './counterlabel.js';

afterEach(cleanup);

describe('CounterLabelView', () => {
  it('renders the count content', () => {
    render(<CounterLabelView count={12} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders the secondary variant by default', () => {
    render(<CounterLabelView count={12} />);
    // Primer stamps the resolved emphasis onto the visible (aria-hidden) span.
    expect(screen.getByText('12')).toHaveAttribute('data-variant', 'secondary');
  });

  it('honors the variant prop', () => {
    render(<CounterLabelView count={12} variant="primary" />);
    expect(screen.getByText('12')).toHaveAttribute('data-variant', 'primary');
  });
});
