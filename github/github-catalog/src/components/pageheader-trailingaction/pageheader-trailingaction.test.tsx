import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderTrailingActionView} from './pageheader-trailingaction';

afterEach(cleanup);

describe('PageHeaderTrailingActionView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderTrailingActionView>
        <span>Child</span>
      </PageHeaderTrailingActionView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderTrailingActionView hidden>
        <span>x</span>
      </PageHeaderTrailingActionView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
