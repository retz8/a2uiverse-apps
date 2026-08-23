import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderTitleAreaView} from './pageheader-titlearea';

afterEach(cleanup);

describe('PageHeaderTitleAreaView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderTitleAreaView>
        <span>Child</span>
      </PageHeaderTitleAreaView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('renders with a variant selected', () => {
    render(
      <PageHeaderTitleAreaView variant="large">
        <span>Child</span>
      </PageHeaderTitleAreaView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderTitleAreaView hidden>
        <span>x</span>
      </PageHeaderTitleAreaView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
