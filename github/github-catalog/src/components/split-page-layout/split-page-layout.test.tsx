import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {SplitPageLayoutView} from './split-page-layout';

afterEach(cleanup);

describe('SplitPageLayoutView', () => {
  it('renders every supplied region slot', () => {
    render(
      <SplitPageLayoutView
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

  it('renders the Primer PageLayout root container', () => {
    const {container} = render(<SplitPageLayoutView content={<span>Only content</span>} />);
    expect(container.querySelector('[data-component="PageLayout"]')).not.toBeNull();
  });

  it('omits region slots that are not supplied', () => {
    render(<SplitPageLayoutView content={<span>Just content</span>} />);
    expect(screen.getByText('Just content')).toBeInTheDocument();
    expect(screen.queryByText('Pane region')).toBeNull();
  });
});
