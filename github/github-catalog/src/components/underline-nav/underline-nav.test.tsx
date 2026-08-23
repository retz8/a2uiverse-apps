import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {UnderlineNavView} from './underline-nav';

afterEach(cleanup);

describe('UnderlineNavView', () => {
  it('renders its children inside the nav landmark named by aria-label', () => {
    render(
      <UnderlineNavView ariaLabel="Repository">
        <span data-testid="child">Tab</span>
      </UnderlineNavView>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByRole('navigation', {name: 'Repository'})).toBeInTheDocument();
  });

  it('forwards the variant to the nav row', () => {
    const {container} = render(
      <UnderlineNavView ariaLabel="Repository" variant="flush">
        <span>Tab</span>
      </UnderlineNavView>,
    );
    // Primer stamps the variant as a data attribute on the nav element.
    expect(container.querySelector('nav')).toHaveAttribute('data-variant', 'flush');
  });
});
