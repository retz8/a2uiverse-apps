import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ActionBarGroupView} from './actionbar-group';

afterEach(cleanup);

describe('ActionBarGroupView', () => {
  it('renders a group wrapper containing its built children', () => {
    const {container} = render(
      <ActionBarGroupView>
        <button type="button">Bold</button>
        <button type="button">Italic</button>
      </ActionBarGroupView>,
    );
    expect(container.querySelector('[data-component="ActionBar.Group"]')).not.toBeNull();
    expect(screen.getByRole('button', {name: 'Bold'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Italic'})).toBeInTheDocument();
  });
});
