import {describe, it, expect, afterEach, vi} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, RadioGroup, FormControl, Radio} from '@primer/react';
import type {ReactElement} from 'react';
import {RadioGroupView} from './radiogroup';

afterEach(cleanup);

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('RadioGroupView', () => {
  it('groups a label and FormControl-wrapped radio options under a fieldset', () => {
    const {container} = renderInTheme(
      <RadioGroupView name="choices">
        <RadioGroup.Label>Choices</RadioGroup.Label>
        <FormControl>
          <Radio value="one" />
          <FormControl.Label>Choice one</FormControl.Label>
        </FormControl>
        <FormControl>
          <Radio value="two" />
          <FormControl.Label>Choice two</FormControl.Label>
        </FormControl>
      </RadioGroupView>,
    );
    expect(screen.getByText('Choices')).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: 'Choice one'})).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: 'Choice two'})).toBeInTheDocument();
    expect(container.querySelector('fieldset')).toBeInTheDocument();
  });

  it('shares the group `name` onto every radio via RadioGroupContext', () => {
    // The radios carry no `name` of their own; Primer's Radio reads `name` from RadioGroupContext,
    // so the group's `name` reaches each input — this is what makes them mutually exclusive.
    renderInTheme(
      <RadioGroupView name="choices">
        <RadioGroup.Label>Choices</RadioGroup.Label>
        <FormControl>
          <Radio value="one" />
          <FormControl.Label>Choice one</FormControl.Label>
        </FormControl>
        <FormControl>
          <Radio value="two" />
          <FormControl.Label>Choice two</FormControl.Label>
        </FormControl>
      </RadioGroupView>,
    );
    expect(screen.getByRole('radio', {name: 'Choice one'})).toHaveAttribute('name', 'choices');
    expect(screen.getByRole('radio', {name: 'Choice two'})).toHaveAttribute('name', 'choices');
  });

  it("surfaces the group's required state onto the legend", () => {
    renderInTheme(
      <RadioGroupView name="choices" required>
        <RadioGroup.Label>Choices</RadioGroup.Label>
        <FormControl>
          <Radio value="one" />
          <FormControl.Label>Choice one</FormControl.Label>
        </FormControl>
      </RadioGroupView>,
    );
    // Primer surfaces the group's `required` via CheckboxOrRadioGroupContext: a VisuallyHidden
    // ", required" is added to the legend for assistive tech, and the label reads the same context
    // to render a visible required asterisk.
    expect(screen.getByText(', required')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('carries aria-labelledby onto the group when labeled externally (the escape hatch)', () => {
    // The escape hatch is used *instead of* a RadioGroup.Label: with no Label child, Primer renders
    // the group as a `[role=group]` element and applies `aria-labelledby` to it (pointing at the
    // external labelling element). With a Label present it renders a <fieldset>/<legend> and the
    // legend — not aria-labelledby — provides the accessible name.
    renderInTheme(
      <>
        <span id="external-label">Choices</span>
        <RadioGroupView name="choices" ariaLabelledby="external-label">
          <FormControl>
            <Radio value="one" />
            <FormControl.Label>Choice one</FormControl.Label>
          </FormControl>
        </RadioGroupView>
      </>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby', 'external-label');
  });

  it('fires the group onChange when a radio is selected', () => {
    const onChange = vi.fn();
    renderInTheme(
      <RadioGroupView name="choices" onChange={onChange}>
        <RadioGroup.Label>Choices</RadioGroup.Label>
        <FormControl>
          <Radio value="one" />
          <FormControl.Label>Choice one</FormControl.Label>
        </FormControl>
      </RadioGroupView>,
    );
    fireEvent.click(screen.getByRole('radio', {name: 'Choice one'}));
    expect(onChange).toHaveBeenCalled();
  });
});
