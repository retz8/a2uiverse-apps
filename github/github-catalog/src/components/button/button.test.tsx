import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ButtonView} from './button';

afterEach(cleanup);

describe('ButtonView', () => {
  it('renders its child content as the label', () => {
    render(<ButtonView>Save</ButtonView>);
    expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
  });

  it('fires onClick when clicked (the resolved action)', () => {
    const onClick = vi.fn();
    render(<ButtonView onClick={onClick}>Save</ButtonView>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes variant and size to Primer as data-* attributes', () => {
    render(
      <ButtonView variant="primary" size="large">
        Save
      </ButtonView>,
    );
    const el = screen.getByRole('button');
    expect(el).toHaveAttribute('data-variant', 'primary');
    expect(el).toHaveAttribute('data-size', 'large');
  });

  it('honors disabled', () => {
    render(<ButtonView disabled>Save</ButtonView>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies accessibility label and description as aria-* attributes', () => {
    render(
      <ButtonView accessibility={{label: 'Submit form', description: 'Submits the data'}}>
        Save
      </ButtonView>,
    );
    const el = screen.getByRole('button', {name: 'Submit form'});
    expect(el).toHaveAttribute('aria-label', 'Submit form');
    expect(el).toHaveAttribute('aria-description', 'Submits the data');
  });

  it('renders a leadingVisual alongside the label', () => {
    render(<ButtonView leadingVisual={<span data-testid="lv">LV</span>}>Save</ButtonView>);
    expect(screen.getByTestId('lv')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Save/})).toBeInTheDocument();
  });

  it('renders a trailingVisual alongside the label', () => {
    render(<ButtonView trailingVisual={<span data-testid="tv">TV</span>}>Save</ButtonView>);
    expect(screen.getByTestId('tv')).toBeInTheDocument();
  });

  it('renders a trailingAction as an element (Primer accepts it via react-is isElement)', () => {
    render(
      <ButtonView
        trailingVisual={<span data-testid="tv">TV</span>}
        trailingAction={<span data-testid="ta">TA</span>}
      >
        Save
      </ButtonView>,
    );
    expect(screen.getByTestId('ta')).toBeInTheDocument();
  });

  it('renders icon-only, discarding the label (Primer icon precedence)', () => {
    render(<ButtonView icon={<span data-testid="icon">I</span>}>Hidden</ButtonView>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders with no child (icon-only mode has no label)', () => {
    render(<ButtonView icon={<span data-testid="icon">I</span>} accessibility={{label: 'Star'}} />);
    expect(screen.getByRole('button', {name: 'Star'})).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
