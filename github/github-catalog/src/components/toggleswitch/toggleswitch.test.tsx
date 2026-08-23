import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent, act} from '@testing-library/react';
import {ToggleSwitchView} from './toggleswitch';

afterEach(cleanup);

describe('ToggleSwitchView', () => {
  it('renders the "Off" status text when unchecked', () => {
    render(<ToggleSwitchView checked={false} />);
    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the "On" status text when checked', () => {
    render(<ToggleSwitchView checked={true} />);
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('fires onToggle with the flipped value when clicked (the write-back + action signal)', () => {
    const onToggle = vi.fn();
    render(<ToggleSwitchView checked={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', () => {
    const onToggle = vi.fn();
    render(<ToggleSwitchView checked={false} disabled onToggle={onToggle} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(btn);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('does not toggle when loading', () => {
    const onToggle = vi.fn();
    render(<ToggleSwitchView checked={false} loading onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('forwards the size to Primer as a data-* attribute', () => {
    render(<ToggleSwitchView checked={false} size="small" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'small');
  });

  it('honors the statusLabelPosition', () => {
    const {container} = render(<ToggleSwitchView checked={false} statusLabelPosition="end" />);
    expect(container.querySelector('[data-status-label-position="end"]')).toBeInTheDocument();
  });

  it('renders custom on/off status labels', () => {
    const {rerender} = render(
      <ToggleSwitchView checked={false} buttonLabelOn="Show" buttonLabelOff="Hide" />,
    );
    expect(screen.getByText('Hide')).toBeInTheDocument();
    rerender(<ToggleSwitchView checked={true} buttonLabelOn="Show" buttonLabelOff="Hide" />);
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  it('exposes the accessibility label as aria-label on the switch', () => {
    const {container} = render(
      <ToggleSwitchView checked={false} accessibility={{label: 'Notifications'}} />,
    );
    expect(container.querySelector('[aria-label="Notifications"]')).toBeInTheDocument();
  });

  it('announces the loadingLabel to assistive tech only after loadingLabelDelay (non-visual)', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToggleSwitchView
          checked={false}
          loading
          loadingLabel="Saving preference"
          loadingLabelDelay={2000}
        />,
      );
      expect(screen.queryByText('Saving preference')).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText('Saving preference')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
