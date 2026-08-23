import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, cleanup, fireEvent, waitFor} from '@testing-library/react';
import {DetailsView} from './details';

afterEach(cleanup);

describe('DetailsView', () => {
  it('renders the summary label', () => {
    render(<DetailsView summary={<span>More info</span>} open={false} />);
    expect(screen.getByText('More info')).toBeInTheDocument();
  });

  it('renders the collapsible body', () => {
    render(
      <DetailsView summary={<span>More info</span>} open={true}>
        <span>Body content</span>
      </DetailsView>,
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('reflects the expanded state on the <details> element', () => {
    render(<DetailsView summary={<span>More info</span>} open={true} />);
    expect(screen.getByText('More info').closest('details')).toHaveAttribute('open');
  });

  it('reflects the collapsed state on the <details> element', () => {
    render(<DetailsView summary={<span>More info</span>} open={false} />);
    expect(screen.getByText('More info').closest('details')).not.toHaveAttribute('open');
  });

  it('writes back through setOpen when the summary is toggled', async () => {
    const setOpen = vi.fn();
    render(<DetailsView summary={<span>More info</span>} open={false} setOpen={setOpen} />);
    fireEvent.click(screen.getByText('More info'));
    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(true));
  });

  it('renders the summary inside a Details.Summary slot', () => {
    render(<DetailsView summary={<span>More info</span>} open={false} />);
    const summary = screen.getByText('More info').closest('summary');
    expect(summary).not.toBeNull();
    expect(summary).toHaveAttribute('data-component', 'Details.Summary');
  });

  it('applies accessibility label and description as aria-* attributes', () => {
    render(
      <DetailsView
        summary={<span>More info</span>}
        open={false}
        accessibility={{label: 'Show details', description: 'Reveals the extra content'}}
      />,
    );
    const details = screen.getByText('More info').closest('details');
    expect(details).toHaveAttribute('aria-label', 'Show details');
    expect(details).toHaveAttribute('aria-description', 'Reveals the extra content');
  });
});
