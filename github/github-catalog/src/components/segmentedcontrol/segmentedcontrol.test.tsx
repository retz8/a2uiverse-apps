import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {SegmentedControlView} from './segmentedcontrol';

afterEach(cleanup);

describe('SegmentedControlView', () => {
  it('renders its segment children', () => {
    render(
      <SegmentedControlView>
        <button type="button">Preview</button>
        <button type="button">Raw</button>
      </SegmentedControlView>,
    );
    expect(screen.getByRole('button', {name: 'Preview'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Raw'})).toBeInTheDocument();
  });

  it('stamps the size enum as a data attribute', () => {
    const {container} = render(
      <SegmentedControlView size="small">
        <button type="button">x</button>
      </SegmentedControlView>,
    );
    expect(container.querySelector('[data-size="small"]')).not.toBeNull();
  });

  it('forwards fullWidth as a Primer data attribute', () => {
    const {container} = render(
      <SegmentedControlView fullWidth>
        <button type="button">x</button>
      </SegmentedControlView>,
    );
    expect(container.querySelector('[data-full-width="true"]')).not.toBeNull();
  });

  it('forwards a responsive variant map as per-viewport data attributes', () => {
    const {container} = render(
      <SegmentedControlView variant={{narrow: 'hideLabels', regular: 'default'}}>
        <button type="button">x</button>
      </SegmentedControlView>,
    );
    const el = container.querySelector('[data-variant-narrow]');
    expect(el).toHaveAttribute('data-variant-narrow', 'hideLabels');
    expect(el).toHaveAttribute('data-variant-regular', 'default');
  });

  it('applies the accessibility label as aria-label on the group container', () => {
    render(
      <SegmentedControlView accessibility={{label: 'File view'}}>
        <button type="button">x</button>
      </SegmentedControlView>,
    );
    expect(screen.getByRole('list', {name: 'File view'})).toBeInTheDocument();
  });
});
