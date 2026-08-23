import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {TextareaView} from './textarea';

afterEach(cleanup);

function renderView(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('TextareaView', () => {
  it('renders the value content', () => {
    renderView(<TextareaView value={'A multiline\ncomment draft.'} />);
    expect(screen.getByRole('textbox')).toHaveValue('A multiline\ncomment draft.');
  });

  it('shows the placeholder while empty', () => {
    renderView(<TextareaView value="" placeholder="Leave a comment" />);
    expect(screen.getByPlaceholderText('Leave a comment')).toBeInTheDocument();
  });

  it('calls the two-way setter on edit', () => {
    const setValue = vi.fn();
    renderView(<TextareaView value="hi" setValue={setValue} />);
    fireEvent.change(screen.getByRole('textbox'), {target: {value: 'hello'}});
    expect(setValue).toHaveBeenCalledWith('hello');
  });

  it('disables the textarea', () => {
    renderView(<TextareaView value="Cannot edit this" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('mirrors required to aria-required', () => {
    renderView(<TextareaView value="hi" required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('drives aria-invalid from an error validationStatus', () => {
    renderView(<TextareaView value="hi" validationStatus="error" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('passes each resize enum value through as data-resize', () => {
    for (const resize of ['none', 'both', 'horizontal', 'vertical'] as const) {
      cleanup();
      renderView(<TextareaView value="hi" resize={resize} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-resize', resize);
    }
  });

  it('bounds resizing via an inline max-height style', () => {
    renderView(<TextareaView value="hi" maxHeight={400} />);
    expect(screen.getByRole('textbox')).toHaveStyle({maxHeight: '400px'});
  });

  it('maps accessibility label/description onto aria-* attributes', () => {
    renderView(
      <TextareaView value="hi" accessibility={{label: 'Comment', description: 'Your comment'}} />,
    );
    const el = screen.getByRole('textbox');
    expect(el).toHaveAttribute('aria-label', 'Comment');
    expect(el).toHaveAttribute('aria-description', 'Your comment');
  });
});
