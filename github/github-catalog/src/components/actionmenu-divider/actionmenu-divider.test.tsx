import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import {ActionMenuDividerView} from './actionmenu-divider';

afterEach(cleanup);

describe('ActionMenuDividerView', () => {
  it('renders a separator inside a list (the twin of ActionList.Divider)', () => {
    const {container} = render(
      <ThemeProvider>
        <BaseStyles>
          <PrimerActionList>
            <PrimerActionList.Item>Above</PrimerActionList.Item>
            <ActionMenuDividerView />
            <PrimerActionList.Item>Below</PrimerActionList.Item>
          </PrimerActionList>
        </BaseStyles>
      </ThemeProvider>,
    );
    // Primer renders the divider as an aria-hidden separator element.
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
