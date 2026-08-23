import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderActionsView} from './pageheader-actions';

afterEach(cleanup);

describe('PageHeaderActionsView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderActionsView>
        <span>Child</span>
      </PageHeaderActionsView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderActionsView hidden>
        <span>x</span>
      </PageHeaderActionsView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
