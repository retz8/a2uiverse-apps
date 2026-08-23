import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionMenuButtonView} from './actionmenu-button';

afterEach(cleanup);

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

// ActionMenu.Button is the Button surface minus `action`; its visual matrix is proven on the Button
// leaf (6.4). Here we smoke that the trigger renders as a Button and forwards representative props.
describe('ActionMenuButtonView', () => {
  it('renders its child content as the label', () => {
    renderInTheme(<ActionMenuButtonView>Actions</ActionMenuButtonView>);
    expect(screen.getByRole('button', {name: /Actions/})).toBeInTheDocument();
  });

  it('forwards variant and size to the rendered Button', () => {
    renderInTheme(
      <ActionMenuButtonView variant="primary" size="large">
        Actions
      </ActionMenuButtonView>,
    );
    const el = screen.getByRole('button', {name: /Actions/});
    expect(el).toHaveAttribute('data-variant', 'primary');
    expect(el).toHaveAttribute('data-size', 'large');
  });

  it('honors disabled', () => {
    renderInTheme(<ActionMenuButtonView disabled>Actions</ActionMenuButtonView>);
    expect(screen.getByRole('button', {name: /Actions/})).toBeDisabled();
  });

  it('applies accessibility label as an aria attribute', () => {
    renderInTheme(
      <ActionMenuButtonView accessibility={{label: 'Open actions menu'}}>
        Actions
      </ActionMenuButtonView>,
    );
    expect(screen.getByRole('button', {name: 'Open actions menu'})).toBeInTheDocument();
  });
});
