import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionBarView} from './actionbar';

afterEach(cleanup);

function renderView(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionBarView', () => {
  it('renders a labeled toolbar containing its built children', () => {
    renderView(
      <ActionBarView accessibility={{label: 'Formatting'}}>
        <button type="button">Bold</button>
      </ActionBarView>,
    );
    const toolbar = screen.getByRole('toolbar', {name: 'Formatting'});
    expect(toolbar).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Bold'})).toBeInTheDocument();
  });

  it('forwards size and gap to Primer as data-* attributes', () => {
    renderView(
      <ActionBarView accessibility={{label: 'Formatting'}} size="large" gap="none">
        <button type="button">Bold</button>
      </ActionBarView>,
    );
    const toolbar = screen.getByRole('toolbar', {name: 'Formatting'});
    expect(toolbar).toHaveAttribute('data-size', 'large');
    expect(toolbar).toHaveAttribute('data-gap', 'none');
  });

  it('forwards flush to Primer', () => {
    const {container} = renderView(
      <ActionBarView accessibility={{label: 'Formatting'}} flush>
        <button type="button">Bold</button>
      </ActionBarView>,
    );
    expect(container.querySelector('[data-component="ActionBar"]')).toHaveAttribute(
      'data-flush',
      'true',
    );
  });
});
