import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {LabelGroupView} from './label-group';

afterEach(cleanup);

describe('LabelGroupView', () => {
  it('renders its children', () => {
    render(
      <LabelGroupView>
        <span>bug</span>
        <span>enhancement</span>
      </LabelGroupView>,
    );
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('enhancement')).toBeInTheDocument();
  });

  it('renders as a list element and wraps each child in an <li> for ul/ol', () => {
    const {container} = render(
      <LabelGroupView as="ol">
        <span>one</span>
        <span>two</span>
      </LabelGroupView>,
    );
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
  });

  it('renders a plain container without <li> wrapping for a generic element', () => {
    const {container} = render(
      <LabelGroupView as="div">
        <span>one</span>
      </LabelGroupView>,
    );
    expect(container.querySelector('div[data-component="LabelGroup"]')).toBeInTheDocument();
    expect(container.querySelector('li')).toBeNull();
  });

  it('truncates to visibleChildCount and renders the overlay overflow affordance', () => {
    const {container} = render(
      <LabelGroupView visibleChildCount={2}>
        <span>a</span>
        <span>b</span>
        <span>c</span>
        <span>d</span>
      </LabelGroupView>,
    );
    // All children stay in the DOM; the two beyond the count are marked hidden.
    expect(screen.getByText('d')).toBeInTheDocument();
    expect(container.querySelector('[data-component="LabelGroup.Toggle"]')).toBeInTheDocument();
  });

  it('renders the inline overflow affordance when overflowStyle is inline', () => {
    const {container} = render(
      <LabelGroupView overflowStyle="inline" visibleChildCount={1}>
        <span>a</span>
        <span>b</span>
        <span>c</span>
      </LabelGroupView>,
    );
    expect(container.querySelector('[data-component="LabelGroup.Toggle"]')).toBeInTheDocument();
  });
});
