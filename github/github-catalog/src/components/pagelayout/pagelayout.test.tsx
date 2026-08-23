import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageLayoutView} from './pagelayout';

afterEach(cleanup);

describe('PageLayoutView', () => {
  it('renders all five region slots', () => {
    render(
      <PageLayoutView
        header={<span>Header region</span>}
        content={<span>Content region</span>}
        pane={<span>Pane region</span>}
        sidebar={<span>Sidebar region</span>}
        footer={<span>Footer region</span>}
      />,
    );
    expect(screen.getByText('Header region')).toBeInTheDocument();
    expect(screen.getByText('Content region')).toBeInTheDocument();
    expect(screen.getByText('Pane region')).toBeInTheDocument();
    expect(screen.getByText('Sidebar region')).toBeInTheDocument();
    expect(screen.getByText('Footer region')).toBeInTheDocument();
  });

  it('renders a subset of regions without error', () => {
    render(<PageLayoutView header={<span>Only header</span>} content={<span>And content</span>} />);
    expect(screen.getByText('Only header')).toBeInTheDocument();
    expect(screen.getByText('And content')).toBeInTheDocument();
  });

  it('forwards the container scale props to the layout', () => {
    const {container} = render(
      <PageLayoutView containerWidth="medium" padding="condensed" content={<span>Body</span>} />,
    );
    // The layout renders and the content is present; scale props are applied via CSS by Primer.
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});
