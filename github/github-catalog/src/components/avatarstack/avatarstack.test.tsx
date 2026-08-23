import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {AvatarStackView} from './avatarstack';

afterEach(cleanup);

describe('AvatarStackView', () => {
  it('renders its avatar children', () => {
    render(
      <AvatarStackView>
        <img alt="One" src="data:," />
        <img alt="Two" src="data:," />
      </AvatarStackView>,
    );
    expect(screen.getByAltText('One')).toBeInTheDocument();
    expect(screen.getByAltText('Two')).toBeInTheDocument();
  });

  it('forwards variant and shape as Primer data attributes', () => {
    const {container} = render(
      <AvatarStackView variant="stack" shape="square">
        <img alt="a" src="data:," />
      </AvatarStackView>,
    );
    const stack = container.querySelector('[data-component="AvatarStack"]');
    expect(stack).toHaveAttribute('data-variant', 'stack');
    expect(stack).toHaveAttribute('data-shape', 'square');
  });

  it('forwards alignRight and disableExpand', () => {
    const {container} = render(
      <AvatarStackView alignRight disableExpand>
        <img alt="a" src="data:," />
      </AvatarStackView>,
    );
    expect(container.querySelector('[data-component="AvatarStack"]')).toHaveAttribute(
      'data-align-right',
      '',
    );
    expect(container.querySelector('[data-disable-expand]')).not.toBeNull();
  });
});
