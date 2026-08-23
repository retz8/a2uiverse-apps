import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {RadioView} from './radio';

afterEach(cleanup);

describe('RadioView', () => {
  it('renders a native radio input carrying its value and name', () => {
    render(<RadioView value="option-1" name="radio-demo" />);
    const el = screen.getByRole('radio');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('value', 'option-1');
    expect(el).toHaveAttribute('name', 'radio-demo');
  });

  it('honors checked', () => {
    render(<RadioView value="option-1" name="radio-demo" checked onChange={() => {}} />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('honors disabled', () => {
    render(<RadioView value="option-1" name="radio-demo" disabled />);
    expect(screen.getByRole('radio')).toBeDisabled();
  });

  it('honors required', () => {
    render(<RadioView value="option-1" name="radio-demo" required />);
    expect(screen.getByRole('radio')).toBeRequired();
  });

  it('fires onChange when selected (the resolved action)', () => {
    const onChange = vi.fn();
    render(<RadioView value="option-1" name="radio-demo" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('applies accessibility label and description as aria-* attributes', () => {
    render(
      <RadioView
        value="option-1"
        name="radio-demo"
        accessibility={{label: 'First option', description: 'Selects the first option'}}
      />,
    );
    const el = screen.getByRole('radio', {name: 'First option'});
    expect(el).toHaveAttribute('aria-label', 'First option');
    expect(el).toHaveAttribute('aria-description', 'Selects the first option');
  });
});
