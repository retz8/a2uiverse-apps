import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderDescriptionView} from './pageheader-description';

afterEach(cleanup);

describe('PageHeaderDescriptionView', () => {
  it('renders its children', () => {
    render(
      <PageHeaderDescriptionView>
        <span>Child</span>
      </PageHeaderDescriptionView>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('emits the hidden data attributes when hidden is set', () => {
    const {container} = render(
      <PageHeaderDescriptionView hidden>
        <span>x</span>
      </PageHeaderDescriptionView>,
    );
    expect(container.querySelector('[data-hidden-all]')).toBeInTheDocument();
  });
});
