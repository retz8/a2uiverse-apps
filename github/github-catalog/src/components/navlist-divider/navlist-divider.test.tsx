import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {NavList as PrimerNavList} from '@primer/react';
import {NavListDividerView} from './navlist-divider';

afterEach(cleanup);

// Divider renders inside a NavList; wrap it so the container context is present.
describe('NavListDividerView', () => {
  it('renders a separator element', () => {
    const {container} = render(
      <PrimerNavList aria-label="Repository">
        <PrimerNavList.Item href="#/a">A</PrimerNavList.Item>
        <NavListDividerView />
        <PrimerNavList.Item href="#/b">B</PrimerNavList.Item>
      </PrimerNavList>,
    );
    // Primer renders the divider as an <li aria-hidden> rule inside the list.
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
