import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {TextInputView} from './textinput';

afterEach(cleanup);

function renderView(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('TextInputView', () => {
  it('renders the value content', () => {
    renderView(<TextInputView value="octocat" />);
    expect(screen.getByRole('textbox')).toHaveValue('octocat');
  });

  it('shows the placeholder while empty', () => {
    renderView(<TextInputView value="" placeholder="Search repositories" />);
    expect(screen.getByPlaceholderText('Search repositories')).toBeInTheDocument();
  });

  it('calls the two-way setter on edit', () => {
    const setValue = vi.fn();
    renderView(<TextInputView value="octo" setValue={setValue} />);
    fireEvent.change(screen.getByRole('textbox'), {target: {value: 'octocat'}});
    expect(setValue).toHaveBeenCalledWith('octocat');
  });

  it('disables the input', () => {
    renderView(<TextInputView value="Cannot edit" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('mirrors required to aria-required', () => {
    renderView(<TextInputView value="hi" required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('drives aria-invalid from an error validationStatus', () => {
    renderView(<TextInputView value="hi" validationStatus="error" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets the input type', () => {
    const {container} = renderView(<TextInputView value="octocat@github.com" type="email" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'email');
  });

  it('shows the visually-hidden loader text while loading', () => {
    renderView(<TextInputView value="hi" loading loaderText="Loading results" />);
    expect(screen.getByText('Loading results')).toBeInTheDocument();
  });

  it('applies monospace and size as data-* attributes on the wrapper', () => {
    const {container} = renderView(
      <TextInputView value="git rev-parse HEAD" monospace size="large" />,
    );
    const wrapper = container.querySelector('[data-component="TextInput"]');
    expect(wrapper).toHaveAttribute('data-monospace', 'true');
    expect(wrapper).toHaveAttribute('data-size', 'large');
  });

  it('renders a character counter when a characterLimit is set', () => {
    renderView(<TextInputView value="hi" characterLimit={20} />);
    expect(screen.getByText(/You can enter up to 20 characters/)).toBeInTheDocument();
  });

  it('maps accessibility label/description onto aria-* attributes', () => {
    renderView(
      <TextInputView value="hi" accessibility={{label: 'Search', description: 'Search repos'}} />,
    );
    const el = screen.getByRole('textbox');
    expect(el).toHaveAttribute('aria-label', 'Search');
    expect(el).toHaveAttribute('aria-description', 'Search repos');
  });

  it('renders a leadingVisual inside the input', () => {
    renderView(<TextInputView value="octocat" leadingVisual={<span data-testid="lv">LV</span>} />);
    expect(screen.getByTestId('lv')).toBeInTheDocument();
  });

  it('renders a trailingVisual inside the input', () => {
    renderView(<TextInputView value="octocat" trailingVisual={<span data-testid="tv">TV</span>} />);
    expect(screen.getByTestId('tv')).toBeInTheDocument();
  });

  it('renders a trailingAction inside the input', () => {
    const {container} = renderView(
      <TextInputView value="octocat" trailingAction={<span data-testid="ta">TA</span>} />,
    );
    expect(screen.getByTestId('ta')).toBeInTheDocument();
    expect(container.querySelector('[data-component="TextInput"]')).toHaveAttribute(
      'data-trailing-action',
      'true',
    );
  });
});
