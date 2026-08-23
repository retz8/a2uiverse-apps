import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderContextAreaView} from './pageheader-contextarea';

afterEach(cleanup);

describe('PageHeaderContextAreaView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderContextAreaView>
        <span>Child</span>
      </PageHeaderContextAreaView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderContextAreaView hidden>
        <span>x</span>
      </PageHeaderContextAreaView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
