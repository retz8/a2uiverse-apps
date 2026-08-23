import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {StateLabelView} from './statelabel';

afterEach(cleanup);

describe('StateLabelView', () => {
  it('renders the status text content', () => {
    render(<StateLabelView text="Open" status="issueOpened" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('stamps the status onto the rendered badge', () => {
    render(<StateLabelView text="Merged" status="pullMerged" />);
    // Primer stamps the resolved status onto the visible span as data-status.
    expect(screen.getByText('Merged')).toHaveAttribute('data-status', 'pullMerged');
  });

  it('renders the medium size by default', () => {
    render(<StateLabelView text="Open" status="issueOpened" />);
    expect(screen.getByText('Open')).toHaveAttribute('data-size', 'medium');
  });

  it('honors the size prop', () => {
    render(<StateLabelView text="Open" status="issueOpened" size="small" />);
    expect(screen.getByText('Open')).toHaveAttribute('data-size', 'small');
  });

  it('renders nothing for a status outside the enum', () => {
    render(<StateLabelView text="Open" status={'bogus' as never} />);
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
  });

  it('renders nothing when a live agent leaves status unresolved (non-string)', () => {
    render(<StateLabelView text="Open" status={{path: 'status'} as never} />);
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
  });

  it('renders nothing while status is still undefined mid-stream', () => {
    render(<StateLabelView text="Open" status={undefined as never} />);
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
  });
});
