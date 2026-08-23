import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderTrailingVisualView} from './pageheader-trailingvisual';

afterEach(cleanup);

describe('PageHeaderTrailingVisualView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderTrailingVisualView>
        <span>Child</span>
      </PageHeaderTrailingVisualView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderTrailingVisualView hidden>
        <span>x</span>
      </PageHeaderTrailingVisualView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
