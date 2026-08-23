import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, CheckboxGroup, FormControl, Checkbox} from '@primer/react';
import type {ReactElement} from 'react';
import {CheckboxGroupView} from './checkboxgroup';

afterEach(cleanup);

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('CheckboxGroupView', () => {
  it('groups a label and FormControl-wrapped checkbox options under a fieldset', () => {
    const {container} = renderInTheme(
      <CheckboxGroupView>
        <CheckboxGroup.Label>Notifications</CheckboxGroup.Label>
        <FormControl>
          <Checkbox value="comments" />
          <FormControl.Label>Comments</FormControl.Label>
        </FormControl>
        <FormControl>
          <Checkbox value="prs" />
          <FormControl.Label>Pull requests</FormControl.Label>
        </FormControl>
      </CheckboxGroupView>,
    );
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', {name: 'Comments'})).toBeInTheDocument();
    expect(screen.getByRole('checkbox', {name: 'Pull requests'})).toBeInTheDocument();
    expect(container.querySelector('fieldset')).toBeInTheDocument();
  });

  it('surfaces the required state onto the legend when required', () => {
    renderInTheme(
      <CheckboxGroupView required>
        <CheckboxGroup.Label>Notifications</CheckboxGroup.Label>
        <FormControl>
          <Checkbox value="comments" />
          <FormControl.Label>Comments</FormControl.Label>
        </FormControl>
      </CheckboxGroupView>,
    );
    // Primer surfaces the group's `required` via CheckboxOrRadioGroupContext: a VisuallyHidden
    // ", required" is added to the legend for assistive tech, and the label reads the same context
    // to render a visible required asterisk. (The decision doc characterised this as ARIA-only /
    // "no visible indicator"; Primer's CheckboxGroup.Label in fact renders the asterisk too — this
    // test asserts the real behaviour, and the render passes `required` through faithfully.)
    expect(screen.getByText(', required')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('dims the whole group when disabled', () => {
    renderInTheme(
      <CheckboxGroupView disabled>
        <CheckboxGroup.Label>Notifications</CheckboxGroup.Label>
        <FormControl>
          <Checkbox value="comments" />
          <FormControl.Label>Comments</FormControl.Label>
        </FormControl>
      </CheckboxGroupView>,
    );
    expect(screen.getByRole('checkbox', {name: 'Comments'})).toBeDisabled();
  });
});
