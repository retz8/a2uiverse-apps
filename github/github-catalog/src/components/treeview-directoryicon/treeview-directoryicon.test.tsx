import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {ThemeProvider, BaseStyles, TreeView as PrimerTreeView} from '@primer/react';
import type {ReactElement} from 'react';
import {TreeViewDirectoryIconView} from './treeview-directoryicon';

afterEach(cleanup);

// DirectoryIcon is a preset icon placed inside a LeadingVisual, whose folder glyph reflects the
// item's expansion via Primer's item context — so it is composed inside an expanded Item.
function renderInItem(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <PrimerTreeView aria-label="Files">
          <PrimerTreeView.Item id="dir" defaultExpanded>
            <PrimerTreeView.LeadingVisual>{ui}</PrimerTreeView.LeadingVisual>
            src
          </PrimerTreeView.Item>
        </PrimerTreeView>
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe('TreeViewDirectoryIconView', () => {
  it('renders the preset folder glyph', () => {
    const {container} = renderInItem(<TreeViewDirectoryIconView />);
    // The preset directory icon renders as an octicon SVG inside the leading visual.
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
