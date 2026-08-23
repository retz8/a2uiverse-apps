import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionMenuAnchorView} from './actionmenu-anchor';

afterEach(cleanup);

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionMenuAnchorView', () => {
  it('renders its custom trigger child', () => {
    renderInTheme(<ActionMenuAnchorView child={<button type="button">Kebab</button>} />);
    expect(screen.getByRole('button', {name: 'Kebab'})).toBeInTheDocument();
  });

  it('renders without a child (empty placeholder — Anchor always has a valid element)', () => {
    const {container} = renderInTheme(<ActionMenuAnchorView />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});
