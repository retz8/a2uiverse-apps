import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {SegmentedControlButtonView} from './segmentedcontrolbutton';

afterEach(cleanup);

describe('SegmentedControlButtonView', () => {
  it('renders its label as the segment text', () => {
    render(<SegmentedControlButtonView label="Preview" />);
    expect(screen.getByRole('button', {name: 'Preview'})).toBeInTheDocument();
  });

  it('fires onClick when clicked (the parent-supplied select handler)', () => {
    const onClick = vi.fn();
    render(<SegmentedControlButtonView label="Preview" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks the selected segment via aria-pressed', () => {
    render(<SegmentedControlButtonView label="Preview" selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('honors disabled (aria-disabled)', () => {
    render(<SegmentedControlButtonView label="Preview" disabled />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders a trailing count', () => {
    render(<SegmentedControlButtonView label="Raw" count="12" />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders a leadingVisual alongside the label', () => {
    render(
      <SegmentedControlButtonView
        label="Preview"
        leadingVisual={<span data-testid="lv">LV</span>}
      />,
    );
    expect(screen.getByTestId('lv')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Preview/})).toBeInTheDocument();
  });

  it('applies an accessibility label/description as aria-* attributes', () => {
    render(
      <SegmentedControlButtonView
        label="Preview"
        accessibility={{label: 'Preview tab', description: 'Rendered preview'}}
      />,
    );
    const el = screen.getByRole('button', {name: 'Preview tab'});
    expect(el).toHaveAttribute('aria-label', 'Preview tab');
    expect(el).toHaveAttribute('aria-description', 'Rendered preview');
  });
});
