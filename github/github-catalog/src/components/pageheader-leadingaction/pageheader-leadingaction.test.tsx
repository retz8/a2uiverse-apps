import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderLeadingActionView} from './pageheader-leadingaction';

afterEach(cleanup);

describe('PageHeaderLeadingActionView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderLeadingActionView>
        <span>Child</span>
      </PageHeaderLeadingActionView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderLeadingActionView hidden>
        <span>x</span>
      </PageHeaderLeadingActionView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
