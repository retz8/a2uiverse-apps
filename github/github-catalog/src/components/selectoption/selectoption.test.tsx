import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, Select as PrimerSelect} from '@primer/react';
import type {ReactElement} from 'react';
import {SelectOptionView} from './selectoption';

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

describe('SelectOptionView', () => {
  it('renders its text label and underlying value', () => {
    renderInSelect(<SelectOptionView text="Bug" value="bug" />);
    const opt = screen.getByRole('option', {name: 'Bug'}) as HTMLOptionElement;
    expect(opt.value).toBe('bug');
  });

  it('disables the option', () => {
    renderInSelect(<SelectOptionView text="Bug" value="bug" disabled />);
    expect(screen.getByRole('option', {name: 'Bug'})).toBeDisabled();
  });
});
