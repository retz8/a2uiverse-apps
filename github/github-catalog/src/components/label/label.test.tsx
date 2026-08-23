import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {LabelView} from './label';

afterEach(cleanup);

describe('LabelView', () => {
  it('renders the text content', () => {
    render(<LabelView text="In progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders as a span by default', () => {
    render(<LabelView text="Badge" />);
    expect(screen.getByText('Badge').tagName).toBe('SPAN');
  });

  it('passes variant and size to Primer as data-* attributes', () => {
    render(<LabelView text="Done" variant="success" size="large" />);
    const el = screen.getByText('Done');
    expect(el).toHaveAttribute('data-variant', 'success');
    expect(el).toHaveAttribute('data-size', 'large');
  });

  it('defaults to the default variant and small size', () => {
    render(<LabelView text="Plain" />);
    const el = screen.getByText('Plain');
    expect(el).toHaveAttribute('data-variant', 'default');
    expect(el).toHaveAttribute('data-size', 'small');
  });
});
