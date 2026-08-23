import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListTrailingVisualView} from './navlist-trailingvisual';

afterEach(cleanup);

// TrailingVisual renders inside a NavList.Item; wrap it so the container context is present.
describe('NavListTrailingVisualView', () => {
  it('renders its visual child', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Item href="#/pulls">
          Pull requests
          <NavListTrailingVisualView>
            <span data-testid="count">8</span>
          </NavListTrailingVisualView>
        </PrimerNavList.Item>
      </PrimerNavList>,
    );
    expect(screen.getByTestId('count')).toBeInTheDocument();
  });
});
