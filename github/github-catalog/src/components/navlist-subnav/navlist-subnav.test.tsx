import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListSubNavView} from './navlist-subnav';

afterEach(cleanup);

// SubNav renders inside an expanded NavList.Item; wrap it so the container context is present.
describe('NavListSubNavView', () => {
  it('renders its nested children', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Item href="#/pulls" defaultOpen>
          Pull requests
          <NavListSubNavView>
            <PrimerNavList.Item href="#/pulls/open">Open</PrimerNavList.Item>
          </NavListSubNavView>
        </PrimerNavList.Item>
      </PrimerNavList>,
    );
    expect(screen.getByRole('link', {name: 'Open'})).toBeInTheDocument();
  });
});
