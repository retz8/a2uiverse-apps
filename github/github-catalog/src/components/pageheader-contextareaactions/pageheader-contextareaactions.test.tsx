import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderContextAreaActionsView} from './pageheader-contextareaactions';

afterEach(cleanup);

describe('PageHeaderContextAreaActionsView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderContextAreaActionsView>
        <span>Child</span>
      </PageHeaderContextAreaActionsView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderContextAreaActionsView hidden>
        <span>x</span>
      </PageHeaderContextAreaActionsView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
