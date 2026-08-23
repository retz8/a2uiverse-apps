import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListGroupHeadingView} from './navlist-groupheading';

afterEach(cleanup);

// GroupHeading renders inside a NavList.Group; wrap it so the container context is present.
describe('NavListGroupHeadingView', () => {
  it('renders its heading text', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Group>
          <NavListGroupHeadingView text="Support" />
          <PrimerNavList.Item href="#/docs">Docs</PrimerNavList.Item>
        </PrimerNavList.Group>
      </PrimerNavList>,
    );
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('renders the chosen semantic heading level', () => {
    render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Group>
          <NavListGroupHeadingView text="Support" as="h3" />
          <PrimerNavList.Item href="#/docs">Docs</PrimerNavList.Item>
        </PrimerNavList.Group>
      </PrimerNavList>,
    );
    expect(screen.getByRole('heading', {level: 3, name: 'Support'})).toBeInTheDocument();
  });
});
