import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListItemView} from './actionlist-item';

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

describe('ActionListItemView', () => {
  it('renders its label content', () => {
    renderInList(<ActionListItemView>View pull request</ActionListItemView>);
    expect(screen.getByText('View pull request')).toBeInTheDocument();
  });

  it('fires onSelect when clicked (the combined write + action handler)', () => {
    const onSelect = vi.fn();
    renderInList(<ActionListItemView onSelect={onSelect}>Assign to me</ActionListItemView>);
    fireEvent.click(screen.getByText('Assign to me'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not fire onSelect when disabled', () => {
    const onSelect = vi.fn();
    renderInList(
      <ActionListItemView onSelect={onSelect} disabled>
        Assign to me
      </ActionListItemView>,
    );
    fireEvent.click(screen.getByText('Assign to me'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('applies the ARIA role', () => {
    renderInList(<ActionListItemView role="option">Item</ActionListItemView>);
    expect(screen.getByRole('option', {name: 'Item'})).toBeInTheDocument();
  });

  it('renders inactiveText for an inactive item', () => {
    renderInList(
      <ActionListItemView inactiveText="Unavailable during outage">Sync</ActionListItemView>,
    );
    expect(screen.getByText('Unavailable during outage')).toBeInTheDocument();
  });
});
