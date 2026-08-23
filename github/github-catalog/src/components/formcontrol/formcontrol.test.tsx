import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, FormControl, TextInput} from '@primer/react';
import type {ReactElement} from 'react';
import {FormControlView} from './formcontrol';

afterEach(cleanup);

function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

describe('FormControlView', () => {
  it('wraps a label and an input, and exposes the FormControl container', () => {
    const {container} = renderInTheme(
      <FormControlView>
        <FormControl.Label>Repository name</FormControl.Label>
        <TextInput defaultValue="octocat" />
      </FormControlView>,
    );
    expect(screen.getByText('Repository name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('octocat')).toBeInTheDocument();
    expect(container.querySelector('[data-component="FormControl"]')).toBeInTheDocument();
  });

  it('associates the label with the control via a generated htmlFor', () => {
    renderInTheme(
      <FormControlView>
        <FormControl.Label>Repository name</FormControl.Label>
        <TextInput defaultValue="octocat" />
      </FormControlView>,
    );
    // FormControl has no author-facing id (envelope field), so it generates its own; the label's
    // htmlFor is wired to that generated id via FormControlContext.
    expect(screen.getByText('Repository name').closest('label')).toHaveAttribute('for');
  });

  it('renders a horizontal layout with a checkbox', () => {
    const {container} = renderInTheme(
      <FormControlView layout="horizontal">
        <FormControl.Label>Enable notifications</FormControl.Label>
        <input type="checkbox" />
      </FormControlView>,
    );
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    expect(container.querySelector('[data-component="FormControl"]')).toBeInTheDocument();
  });
});
