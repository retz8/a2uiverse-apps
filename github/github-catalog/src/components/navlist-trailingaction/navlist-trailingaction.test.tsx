import type {ReactNode} from 'react';
import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListTrailingActionView} from './navlist-trailingaction';

afterEach(cleanup);

// TrailingAction renders inside a NavList.Item; wrap it so the container context is present.
function wrap(node: ReactNode) {
  return (
    <PrimerNavList aria-label="Repository">
      <PrimerNavList.Item href="#/settings">Settings{node}</PrimerNavList.Item>
    </PrimerNavList>
  );
}

describe('NavListTrailingActionView', () => {
  it('renders the icon control and labels it', () => {
    render(
      wrap(
        <NavListTrailingActionView
          icon={<span data-testid="glyph">I</span>}
          accessibility={{label: 'Pin Settings'}}
        />,
      ),
    );
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Pin Settings'})).toBeInTheDocument();
  });

  it('fires onClick when clicked (the resolved action)', () => {
    const onClick = vi.fn();
    render(
      wrap(
        <NavListTrailingActionView
          icon={<span>I</span>}
          accessibility={{label: 'Pin'}}
          onClick={onClick}
        />,
      ),
    );
    fireEvent.click(screen.getByRole('button', {name: 'Pin'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
