import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import {ActionListDividerView} from './actionlist-divider';

afterEach(cleanup);

describe('ActionListDividerView', () => {
  it('renders a separator inside a list', () => {
    const {container} = render(
      <ThemeProvider>
        <BaseStyles>
          <PrimerActionList>
            <PrimerActionList.Item>Above</PrimerActionList.Item>
            <ActionListDividerView />
            <PrimerActionList.Item>Below</PrimerActionList.Item>
          </PrimerActionList>
        </BaseStyles>
      </ThemeProvider>,
    );
    // Primer renders the divider as an <li aria-hidden> separator element.
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
