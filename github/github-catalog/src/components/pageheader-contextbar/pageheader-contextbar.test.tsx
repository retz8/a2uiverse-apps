import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderContextBarView} from './pageheader-contextbar';

afterEach(cleanup);

describe('PageHeaderContextBarView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderContextBarView>
        <span>Child</span>
      </PageHeaderContextBarView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderContextBarView hidden>
        <span>x</span>
      </PageHeaderContextBarView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
