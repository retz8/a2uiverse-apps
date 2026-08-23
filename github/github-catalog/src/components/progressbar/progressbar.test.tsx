import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {ProgressBarView} from './progressbar';

afterEach(cleanup);

describe('ProgressBarView', () => {
  it('renders a single bar whose aria-valuenow reflects progress', () => {
    render(<ProgressBarView progress={65} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '65');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it("maps a bg role to Primer's <role>.emphasis color token", () => {
    render(<ProgressBarView progress={65} bg="accent" />);
    // Primer splits "accent.emphasis" into var(--bgColor-accent-emphasis) on the segment style.
    expect(screen.getByRole('progressbar').getAttribute('style')).toContain(
      'bgColor-accent-emphasis',
    );
  });

  it('honors barSize on the track', () => {
    const {container} = render(<ProgressBarView progress={65} barSize="large" />);
    expect(container.querySelector('[data-component="ProgressBar"]')).toHaveAttribute(
      'data-progress-bar-size',
      'large',
    );
  });

  it('renders inline: data-progress-display on the track is "inline"', () => {
    const {container} = render(<ProgressBarView progress={65} inline />);
    expect(container.querySelector('[data-component="ProgressBar"]')).toHaveAttribute(
      'data-progress-display',
      'inline',
    );
  });

  it('renders block by default: data-progress-display is "block"', () => {
    const {container} = render(<ProgressBarView progress={65} />);
    expect(container.querySelector('[data-component="ProgressBar"]')).toHaveAttribute(
      'data-progress-display',
      'block',
    );
  });

  it('marks the segment animated: data-animated is "true"', () => {
    render(<ProgressBarView progress={65} animated />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-animated', 'true');
  });

  it('maps accessibility.label onto the progressbar aria-label', () => {
    render(<ProgressBarView progress={65} accessibility={{label: 'Upload progress'}} />);
    expect(screen.getByRole('progressbar', {name: 'Upload progress'})).toBeInTheDocument();
  });

  it('renders one segment per authored segment, each labeled by its own aria-label', () => {
    render(
      <ProgressBarView
        segments={[
          {progress: 55, bg: 'success', label: 'TypeScript'},
          {progress: 30, bg: 'accent', label: 'CSS'},
          {progress: 15, bg: 'attention', label: 'Other'},
        ]}
      />,
    );
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
    expect(screen.getByRole('progressbar', {name: 'TypeScript'})).toHaveAttribute(
      'aria-valuenow',
      '55',
    );
    expect(screen.getByRole('progressbar', {name: 'CSS'})).toBeInTheDocument();
    expect(screen.getByRole('progressbar', {name: 'Other'})).toBeInTheDocument();
  });
});
