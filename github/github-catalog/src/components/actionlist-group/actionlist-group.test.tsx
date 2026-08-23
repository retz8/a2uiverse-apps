import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListGroupView} from './actionlist-group';

afterEach(cleanup);

function renderInList(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionList>{ui}</PrimerActionList>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListGroupView', () => {
  it('renders its items', () => {
    renderInList(
      <ActionListGroupView>
        <PrimerActionList.Item>Assign to me</PrimerActionList.Item>
      </ActionListGroupView>,
    );
    expect(screen.getByText('Assign to me')).toBeInTheDocument();
  });

  it('renders its heading label and items (auxiliaryText forwarded without error)', () => {
    renderInList(
      <ActionListGroupView auxiliaryText="opened by octocat">
        <PrimerActionList.GroupHeading as="h3">Pull request #42</PrimerActionList.GroupHeading>
        <PrimerActionList.Item>View</PrimerActionList.Item>
      </ActionListGroupView>,
    );
    expect(screen.getByText('Pull request #42')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });
});
