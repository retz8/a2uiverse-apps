import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionBarIconButtonView} from './actionbar-iconbutton';

afterEach(cleanup);

function renderView(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

const icon = <span data-testid="glyph">I</span>;

describe('ActionBarIconButtonView', () => {
  it('renders the icon content and labels the button', () => {
    renderView(<ActionBarIconButtonView icon={icon} accessibility={{label: 'Bold'}} />);
    expect(screen.getByRole('button', {name: 'Bold'})).toBeInTheDocument();
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
  });

  it('fires onClick when clicked (the resolved action)', () => {
    const onClick = vi.fn();
    renderView(
      <ActionBarIconButtonView icon={icon} accessibility={{label: 'Bold'}} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Bold'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled as aria-disabled (the button stays focusable) and guards the click', () => {
    const onClick = vi.fn();
    renderView(
      <ActionBarIconButtonView
        icon={icon}
        accessibility={{label: 'Delete'}}
        disabled
        onClick={onClick}
      />,
    );
    const el = screen.getByRole('button', {name: 'Delete'});
    expect(el).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });
});
