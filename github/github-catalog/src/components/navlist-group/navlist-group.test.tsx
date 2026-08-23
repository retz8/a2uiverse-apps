import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListGroupView} from './navlist-group';

afterEach(cleanup);

// Group renders inside a NavList; wrap it so the container context is present.
describe('NavListGroupView', () => {
  it('renders its title and grouped items', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <NavListGroupView title="Support">
          <PrimerNavList.Item href="#/docs">Docs</PrimerNavList.Item>
        </NavListGroupView>
      </PrimerNavList>,
    );
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Docs'})).toBeInTheDocument();
  });
});
