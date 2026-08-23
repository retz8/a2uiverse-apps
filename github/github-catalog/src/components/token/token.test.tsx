import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {TokenView} from './token';

afterEach(cleanup);

describe('TokenView', () => {
  it('renders its text label', () => {
    render(<TokenView text="Token from Primer" />);
    expect(screen.getByText('Token from Primer')).toBeInTheDocument();
  });

  it('fires onRemove when the remove button is clicked (the resolved removeAction)', () => {
    const onRemove = vi.fn();
    render(<TokenView text="Remove me" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', {name: 'Remove token'}));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders no remove button when removeAction is omitted', () => {
    render(<TokenView text="No action" />);
    expect(screen.queryByRole('button', {name: 'Remove token'})).not.toBeInTheDocument();
  });

  it('hides the remove button when hideRemoveButton is set', () => {
    render(<TokenView text="No button" onRemove={() => {}} hideRemoveButton />);
    expect(screen.queryByRole('button', {name: 'Remove token'})).not.toBeInTheDocument();
  });

  it('renders a leadingVisual before the text', () => {
    render(<TokenView text="With icon" leadingVisual={<span data-testid="lv">LV</span>} />);
    expect(screen.getByTestId('lv')).toBeInTheDocument();
    expect(screen.getByText('With icon')).toBeInTheDocument();
  });

  it('reflects the selected state', () => {
    render(<TokenView text="Selected" isSelected />);
    expect(screen.getByText('Selected').closest('[data-is-selected="true"]')).not.toBeNull();
  });

  it('renders as the requested element (a link)', () => {
    render(<TokenView text="Link" as="a" />);
    expect(screen.getByText('Link').closest('a')).not.toBeNull();
  });

  it('applies accessibility label and description as aria-* attributes', () => {
    const {container} = render(
      <TokenView text="Tag" accessibility={{label: 'Remove tag', description: 'Removes it'}} />,
    );
    const el = container.querySelector('[aria-label="Remove tag"]');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('aria-description', 'Removes it');
  });
});
