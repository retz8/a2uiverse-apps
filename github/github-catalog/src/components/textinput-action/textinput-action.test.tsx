import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {TextInputActionView} from './textinput-action';

afterEach(cleanup);

function renderView(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

const icon = <span data-testid="glyph">I</span>;

describe('TextInputActionView', () => {
  it('renders an icon action button labelled by accessibility.label', () => {
    renderView(<TextInputActionView icon={icon} accessibility={{label: 'Clear'}} />);
    expect(screen.getByRole('button', {name: 'Clear'})).toBeInTheDocument();
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
  });

  it('fires onClick when clicked (the resolved action)', () => {
    const onClick = vi.fn();
    renderView(
      <TextInputActionView icon={icon} accessibility={{label: 'Clear'}} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Clear'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('honors disabled', () => {
    renderView(<TextInputActionView icon={icon} accessibility={{label: 'Clear'}} disabled />);
    expect(screen.getByRole('button', {name: 'Clear'})).toBeDisabled();
  });

  it('exposes the accessibility label as the button accessible name (via the tooltip)', () => {
    renderView(<TextInputActionView icon={icon} accessibility={{label: 'Search'}} />);
    // Primer labels the icon button through its tooltip (aria-labelledby), so the accessible
    // name resolves to the label even though no raw aria-label attribute is set.
    expect(screen.getByRole('button', {name: 'Search'})).toBeInTheDocument();
  });

  it('positions the tooltip per tooltipDirection (data-direction) for each enum value', () => {
    for (const direction of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const) {
      cleanup();
      const {container} = renderView(
        <TextInputActionView
          icon={icon}
          accessibility={{label: direction}}
          tooltipDirection={direction}
        />,
      );
      expect(container.querySelector('[data-direction]')).toHaveAttribute(
        'data-direction',
        direction,
      );
    }
  });
});
