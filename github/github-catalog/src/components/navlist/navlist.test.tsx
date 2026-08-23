import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {NavListView} from './navlist';

afterEach(cleanup);

describe('NavListView', () => {
  it('renders its children inside the nav landmark', () => {
    render(
      <NavListView ariaLabel="Repository">
        <span data-testid="child">Item</span>
      </NavListView>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByRole('navigation', {name: 'Repository'})).toBeInTheDocument();
  });

  it('forwards aria-labelledby to the nav region', () => {
    render(
      <>
        <span id="nav-heading">Repository navigation</span>
        <NavListView ariaLabelledby="nav-heading">
          <span>Item</span>
        </NavListView>
      </>,
    );
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-labelledby', 'nav-heading');
  });
});
