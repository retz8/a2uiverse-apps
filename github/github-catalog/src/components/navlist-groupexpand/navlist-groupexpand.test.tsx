import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListGroupExpandView} from './navlist-groupexpand';

afterEach(cleanup);

// GroupExpand renders inside a NavList.Group; wrap it so the container context is present.
describe('NavListGroupExpandView', () => {
  it('renders the show-more control for the collapsed group (items revealed on expand)', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Group>
          <NavListGroupExpandView
            label="Show more repositories"
            pages={2}
            items={[
              {text: 'api', leadingVisual: 'repo', href: '#'},
              {text: 'web', leadingVisual: 'repo', trailingVisual: '3', href: '#'},
            ]}
          />
        </PrimerNavList.Group>
      </PrimerNavList>,
    );
    // Primer's GroupExpand starts collapsed (currentPage 0 shows 0 items); the accessible name
    // of the expand control is present, and no item links are shown yet.
    expect(screen.getByText('Show more repositories')).toBeInTheDocument();
    expect(screen.queryByRole('link', {name: 'api'})).not.toBeInTheDocument();
  });
});
