import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {IssueLabelTokenView} from './issuelabeltoken';

afterEach(cleanup);

describe('IssueLabelTokenView', () => {
  it('renders its text label', () => {
    render(<IssueLabelTokenView text="Issue label from Primer" />);
    expect(screen.getByText('Issue label from Primer')).toBeInTheDocument();
  });

  it('fires onRemove when the remove button is clicked (the resolved removeAction)', () => {
    const onRemove = vi.fn();
    render(<IssueLabelTokenView text="Remove me" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', {name: 'Remove token'}));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders no remove button when removeAction is omitted', () => {
    render(<IssueLabelTokenView text="No action" />);
    expect(screen.queryByRole('button', {name: 'Remove token'})).not.toBeInTheDocument();
  });

  it('hides the remove button when hideRemoveButton is set', () => {
    render(<IssueLabelTokenView text="No button" onRemove={() => {}} hideRemoveButton />);
    expect(screen.queryByRole('button', {name: 'Remove token'})).not.toBeInTheDocument();
  });

  it('derives its fill from fillColor (sets the token custom-property style)', () => {
    const {container} = render(<IssueLabelTokenView text="bug" fillColor="#d73a4a" />);
    expect(container.querySelector('[style*="--label-r"]')).not.toBeNull();
  });

  it('reflects the selected state', () => {
    render(<IssueLabelTokenView text="Selected" isSelected />);
    expect(screen.getByText('Selected').closest('[data-selected="true"]')).not.toBeNull();
  });

  it('renders as the requested element (a link)', () => {
    render(<IssueLabelTokenView text="Link" as="a" />);
    expect(screen.getByText('Link').closest('a')).not.toBeNull();
  });

  it('applies accessibility label and description as aria-* attributes', () => {
    const {container} = render(
      <IssueLabelTokenView
        text="bug"
        accessibility={{label: 'Remove label', description: 'Removes it'}}
      />,
    );
    const el = container.querySelector('[aria-label="Remove label"]');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('aria-description', 'Removes it');
  });

  it('accepts a GitHub-style bare-hex fillColor (no leading #)', () => {
    const {container} = render(<IssueLabelTokenView text="catalog" fillColor="0e8a16" />);
    expect(screen.getByText('catalog')).toBeInTheDocument();
    expect(container.querySelector('[style*="--label-r"]')).not.toBeNull();
  });

  it('falls back to the default fill when fillColor is unresolved (non-string)', () => {
    render(<IssueLabelTokenView text="bug" fillColor={{path: 'color'} as never} />);
    expect(screen.getByText('bug')).toBeInTheDocument();
  });
});
