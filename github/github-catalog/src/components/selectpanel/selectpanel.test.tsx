import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles} from '@primer/react';
import type {ReactElement} from 'react';
import {SelectPanelView, type SelectPanelItemInput} from './selectpanel';

afterEach(cleanup);

// SelectPanel portals its panel to the document body and manages its own focus trap, so a
// ThemeProvider frame is enough — no host container needed.
function renderInTheme(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>{ui}</BaseStyles>
    </ThemeProvider>,
  );
}

const anchor = <button type="button">Labels</button>;
const items: SelectPanelItemInput[] = [
  {id: 'bug', text: 'bug'},
  {id: 'docs', text: 'documentation'},
  {id: 'enh', text: 'enhancement'},
];

describe('SelectPanelView', () => {
  it('renders the trigger and, when open, the panel title and items', () => {
    renderInTheme(
      <SelectPanelView
        anchor={anchor}
        items={items}
        open
        title="Apply labels"
        selectionVariant="multiple"
      />,
    );
    expect(screen.getByRole('button', {name: 'Labels'})).toBeInTheDocument();
    expect(screen.getByText('Apply labels')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('documentation')).toBeInTheDocument();
  });

  it('renders only the trigger when open is false — the panel/items are absent from the DOM', () => {
    renderInTheme(
      <SelectPanelView anchor={anchor} items={items} open={false} title="Apply labels" />,
    );
    expect(screen.getByRole('button', {name: 'Labels'})).toBeInTheDocument();
    expect(screen.queryByText('bug')).not.toBeInTheDocument();
  });

  it('open gesture: clicking the trigger writes back setOpen(true), fires onOpenChange, and shows the panel', () => {
    const setOpen = vi.fn();
    const onOpenChange = vi.fn();
    renderInTheme(
      <SelectPanelView
        anchor={anchor}
        items={items}
        open={false}
        setOpen={setOpen}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.queryByText('bug')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Labels'}));
    expect(setOpen).toHaveBeenCalledWith(true);
    expect(onOpenChange).toHaveBeenCalled();
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('selecting an item fires onItemAction with the item id and its new selection state (multiple)', () => {
    const onItemAction = vi.fn();
    renderInTheme(
      <SelectPanelView
        anchor={anchor}
        items={items}
        open
        selectionVariant="multiple"
        onItemAction={onItemAction}
      />,
    );
    fireEvent.click(screen.getByText('bug'));
    expect(onItemAction).toHaveBeenCalledWith('bug', true);
  });

  it('renders a seeded selected item as selected', () => {
    renderInTheme(
      <SelectPanelView
        anchor={anchor}
        items={[
          {id: 'bug', text: 'bug', selected: true},
          {id: 'docs', text: 'documentation'},
        ]}
        open
        selectionVariant="multiple"
      />,
    );
    expect(document.querySelector('[aria-selected="true"]')).toBeInTheDocument();
  });

  it('renders the modal variant with its content', () => {
    renderInTheme(
      <SelectPanelView anchor={anchor} items={items} open variant="modal" title="Apply labels" />,
    );
    expect(screen.getByText('Apply labels')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('smoke-renders the panel-chrome props (notice, loading, dividers, secondaryAction)', () => {
    renderInTheme(
      <SelectPanelView
        anchor={anchor}
        items={items}
        open
        title="Apply labels"
        notice={{text: 'Managed by policy', variant: 'warning'}}
        showItemDividers
        secondaryAction={<button type="button">Edit labels</button>}
      />,
    );
    expect(screen.getByText('Apply labels')).toBeInTheDocument();
  });
});
