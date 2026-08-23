import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {CheckboxView} from './checkbox';

afterEach(cleanup);

describe('CheckboxView', () => {
  it('renders an unchecked checkbox by default', () => {
    render(<CheckboxView accessibility={{label: 'Notify me'}} />);
    const el = screen.getByRole('checkbox', {name: 'Notify me'});
    expect(el).toBeInTheDocument();
    expect(el).not.toBeChecked();
  });

  it('reflects the checked state', () => {
    render(<CheckboxView checked accessibility={{label: 'Notify me'}} />);
    expect(screen.getByRole('checkbox', {name: 'Notify me'})).toBeChecked();
  });

  it('calls onCheckedChange with the new state when toggled', () => {
    const onCheckedChange = vi.fn();
    render(
      <CheckboxView
        checked={false}
        onCheckedChange={onCheckedChange}
        accessibility={{label: 'x'}}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('conveys the indeterminate state as aria-checked="mixed"', () => {
    render(<CheckboxView indeterminate accessibility={{label: 'Select all'}} />);
    expect(screen.getByRole('checkbox', {name: 'Select all'})).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('honors disabled', () => {
    render(<CheckboxView disabled accessibility={{label: 'x'}} />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('mirrors required to the input (required / aria-required)', () => {
    render(<CheckboxView required accessibility={{label: 'x'}} />);
    const el = screen.getByRole('checkbox');
    expect(el).toBeRequired();
    expect(el).toHaveAttribute('aria-required', 'true');
  });

  it('maps validationStatus="error" to aria-invalid (ARIA-only)', () => {
    render(<CheckboxView validationStatus="error" accessibility={{label: 'x'}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders value as the input value attribute', () => {
    render(<CheckboxView value="newsletter" accessibility={{label: 'x'}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('value', 'newsletter');
  });

  it('applies accessibility label and description as aria-* attributes', () => {
    render(
      <CheckboxView accessibility={{label: 'Subscribe', description: 'Receive our newsletter'}} />,
    );
    const el = screen.getByRole('checkbox', {name: 'Subscribe'});
    expect(el).toHaveAttribute('aria-label', 'Subscribe');
    expect(el).toHaveAttribute('aria-description', 'Receive our newsletter');
  });
});
