import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {StackView} from './stack';

afterEach(cleanup);

describe('StackView', () => {
  it('renders its children', () => {
    render(
      <StackView>
        <span>One</span>
        <span>Two</span>
      </StackView>,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('renders as the given container element', () => {
    const {container} = render(
      <StackView as="nav">
        <span>x</span>
      </StackView>,
    );
    expect(container.querySelector('nav')).toBeInTheDocument();
  });
});
