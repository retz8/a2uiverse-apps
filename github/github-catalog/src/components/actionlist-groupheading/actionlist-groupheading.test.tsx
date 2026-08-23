import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListGroupHeadingView} from './actionlist-groupheading';

afterEach(cleanup);

function renderInGroup(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionList>
          <PrimerActionList.Group>{ui}</PrimerActionList.Group>
        </PrimerActionList>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListGroupHeadingView', () => {
  it('renders its heading label', () => {
    renderInGroup(<ActionListGroupHeadingView as="h3">Danger zone</ActionListGroupHeadingView>);
    expect(screen.getByText('Danger zone')).toBeInTheDocument();
  });

  it('keeps a visually-hidden heading available to assistive tech', () => {
    renderInGroup(
      <ActionListGroupHeadingView as="h3" visuallyHidden>
        Screen-reader label
      </ActionListGroupHeadingView>,
    );
    // The text stays in the DOM (visually hidden, not removed).
    expect(screen.getByText('Screen-reader label')).toBeInTheDocument();
  });
});
