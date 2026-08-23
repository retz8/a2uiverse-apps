import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListItemView} from './navlist-item';

afterEach(cleanup);

// NavList.Item renders inside a NavList container; wrap it so the ActionList context is present.
describe('NavListItemView', () => {
  it('renders its label and links to href', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <NavListItemView href="#/dashboard">Dashboard</NavListItemView>
      </PrimerNavList>,
    );
    const link = screen.getByRole('link', {name: 'Dashboard'});
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#/dashboard');
  });

  it('reflects aria-current on the current item', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <NavListItemView href="#/dashboard" ariaCurrent="page">
          Dashboard
        </NavListItemView>
      </PrimerNavList>,
    );
    expect(screen.getByRole('link', {name: 'Dashboard'})).toHaveAttribute('aria-current', 'page');
  });
});
