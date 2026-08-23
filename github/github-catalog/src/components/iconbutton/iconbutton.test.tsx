import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {IconButtonView} from './iconbutton';

afterEach(cleanup);

// A labeled, disabled IconButton renders without a tooltip wrapper, so its aria-label lands
// directly on the button element — the simplest way to assert the accessible name.
describe('IconButtonView', () => {
  it('renders the icon content and labels the button', () => {
    render(
      <IconButtonView
        icon={<span data-testid="glyph">I</span>}
        accessibility={{label: 'Delete'}}
        disabled
      />,
    );
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('fires onClick when clicked (the resolved action)', () => {
    const onClick = vi.fn();
    render(
      <IconButtonView
        icon={<span data-testid="glyph">I</span>}
        accessibility={{label: 'Like'}}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes variant and size to Primer as data-* attributes', () => {
    render(
      <IconButtonView
        icon={<span data-testid="glyph">I</span>}
        accessibility={{label: 'Star'}}
        variant="danger"
        size="large"
        disabled
      />,
    );
    const el = screen.getByRole('button');
    expect(el).toHaveAttribute('data-variant', 'danger');
    expect(el).toHaveAttribute('data-size', 'large');
  });

  it('applies accessibility.description as aria-description', () => {
    render(
      <IconButtonView
        icon={<span data-testid="glyph">I</span>}
        accessibility={{label: 'Remove', description: 'Removes the item'}}
        disabled
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-description', 'Removes the item');
  });
});
