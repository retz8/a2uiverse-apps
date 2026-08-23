import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListLeadingVisualView} from './navlist-leadingvisual';

afterEach(cleanup);

// LeadingVisual renders inside a NavList.Item; wrap it so the container context is present.
describe('NavListLeadingVisualView', () => {
  it('renders its visual child', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Item href="#/dashboard">
          <NavListLeadingVisualView>
            <span data-testid="glyph">I</span>
          </NavListLeadingVisualView>
          Dashboard
        </PrimerNavList.Item>
      </PrimerNavList>,
    );
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
  });
});
