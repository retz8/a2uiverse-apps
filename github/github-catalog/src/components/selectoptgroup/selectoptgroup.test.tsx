import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Select as PrimerSelect} from '@primer/react';
import type {ReactElement} from 'react';
import {SelectOptGroupView} from './selectoptgroup';

afterEach(cleanup);

function renderInSelect(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerSelect value="bug" onChange={() => {}}>
          {ui}
        </PrimerSelect>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('SelectOptGroupView', () => {
  it('renders its label heading and wraps its option children', () => {
    renderInSelect(
      <SelectOptGroupView label="Open">
        <option value="bug">Bug</option>
        <option value="feature">Feature</option>
      </SelectOptGroupView>,
    );
    expect(screen.getByRole('group', {name: 'Open'})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: 'Bug'})).toBeInTheDocument();
  });

  it('disables the whole group', () => {
    renderInSelect(
      <SelectOptGroupView label="Closed" disabled>
        <option value="done">Done</option>
      </SelectOptGroupView>,
    );
    expect(screen.getByRole('group', {name: 'Closed'})).toBeDisabled();
  });
});
