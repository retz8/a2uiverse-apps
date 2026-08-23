import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import {BellIcon} from '@primer/octicons-react';
import {FormControlLeadingVisualView} from './formcontrol-leadingvisual';

afterEach(cleanup);

describe('FormControlLeadingVisualView', () => {
  it('renders its built child (the leading icon)', () => {
    const {container} = render(
      <ThemeProvider>
        <BaseStyles>
          <FormControlLeadingVisualView>
            <BellIcon aria-label="bell" />
          </FormControlLeadingVisualView>
        </BaseStyles>
      </ThemeProvider>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(
      container.querySelector('[data-component="FormControl.LeadingVisual"]'),
    ).toBeInTheDocument();
  });
});
