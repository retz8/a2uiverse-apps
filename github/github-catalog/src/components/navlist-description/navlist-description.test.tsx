import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListDescriptionView} from './navlist-description';

afterEach(cleanup);

// Description renders inside a NavList.Item; wrap it so the container context is present.
describe('NavListDescriptionView', () => {
  it('renders its supplementary text', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Item href="#/pulls">
          Pull requests
          <NavListDescriptionView text="Open and merged" />
        </PrimerNavList.Item>
      </PrimerNavList>,
    );
    expect(screen.getByText('Open and merged')).toBeInTheDocument();
  });
});
