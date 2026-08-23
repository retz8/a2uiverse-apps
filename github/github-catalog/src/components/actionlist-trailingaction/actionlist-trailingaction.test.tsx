import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {ThemeProvider, BaseStyles, ActionList as PrimerActionList} from '@primer/react';
import type {ReactElement} from 'react';
import {ActionListTrailingActionView} from './actionlist-trailingaction';

afterEach(cleanup);

function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerActionList>
          <PrimerActionList.Item>
            Label
            {ui}
          </PrimerActionList.Item>
        </PrimerActionList>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('ActionListTrailingActionView', () => {
  it('renders a button labeled by `label` (its accessible name)', () => {
    renderInItem(
      <ActionListTrailingActionView
        label="More options"
        icon={<span data-testid="icon">i</span>}
      />,
    );
    expect(screen.getByRole('button', {name: 'More options'})).toBeInTheDocument();
  });

  it('fires onClick when clicked (the resolved action)', () => {
    const onClick = vi.fn();
    renderInItem(
      <ActionListTrailingActionView label="Remove label" icon={<span>i</span>} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Remove label'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a link with href in link mode', () => {
    renderInItem(
      <ActionListTrailingActionView
        label="Open"
        icon={<span>i</span>}
        as="a"
        href="https://github.com"
      />,
    );
    expect(screen.getByRole('link', {name: 'Open'})).toHaveAttribute('href', 'https://github.com');
  });
});
