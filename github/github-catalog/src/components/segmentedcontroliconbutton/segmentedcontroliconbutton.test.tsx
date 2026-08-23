import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {SegmentedControlIconButtonView} from './segmentedcontroliconbutton.js';

afterEach(cleanup);

describe('SegmentedControlIconButtonView', () => {
  it('renders its icon', () => {
    render(
      <SegmentedControlIconButtonView
        icon={<span data-testid="icon">I</span>}
        accessibility={{label: 'Zoom'}}
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('fires onClick when clicked (the parent-supplied select handler)', () => {
    const onClick = vi.fn();
    render(
      <SegmentedControlIconButtonView
        icon={<span data-testid="icon">I</span>}
        accessibility={{label: 'Zoom'}}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks the selected segment via aria-pressed', () => {
    render(
      <SegmentedControlIconButtonView
        icon={<span data-testid="icon">I</span>}
        accessibility={{label: 'Zoom'}}
        selected
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('honors disabled (aria-disabled)', () => {
    render(
      <SegmentedControlIconButtonView
        icon={<span data-testid="icon">I</span>}
        accessibility={{label: 'Zoom'}}
        disabled
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('carries the required accessible label onto the button (with a tooltip description)', () => {
    render(
      <SegmentedControlIconButtonView
        icon={<span data-testid="icon">I</span>}
        accessibility={{label: 'Zoom'}}
        description="Zoom into the diff"
      />,
    );
    // With a description set, Primer routes the tooltip to the description and the aria-label to
    // the accessible name, so the button reports "Zoom".
    expect(screen.getByRole('button', {name: 'Zoom'})).toHaveAttribute('aria-label', 'Zoom');
  });
});
