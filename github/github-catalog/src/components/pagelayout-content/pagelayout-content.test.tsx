import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageLayoutContentView} from './pagelayout-content';

afterEach(cleanup);

describe('PageLayoutContentView', () => {
  it('renders its children inside the default main landmark', () => {
    render(
      <PageLayoutContentView>
        <span>Body copy</span>
      </PageLayoutContentView>,
    );
    expect(screen.getByText('Body copy')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the chosen element for the `as` prop', () => {
    const {container} = render(
      <PageLayoutContentView as="section">
        <span>Body copy</span>
      </PageLayoutContentView>,
    );
    expect(container.querySelector('section')).not.toBeNull();
    expect(container.querySelector('main')).toBeNull();
  });

  it('applies the accessibility label as aria-label on the main landmark', () => {
    render(
      <PageLayoutContentView accessibility={{label: 'Main content'}}>
        <span>Body copy</span>
      </PageLayoutContentView>,
    );
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content');
  });
});
