import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderLeadingVisualView} from './pageheader-leadingvisual';

afterEach(cleanup);

describe('PageHeaderLeadingVisualView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderLeadingVisualView>
        <span>Child</span>
      </PageHeaderLeadingVisualView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderLeadingVisualView hidden>
        <span>x</span>
      </PageHeaderLeadingVisualView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
