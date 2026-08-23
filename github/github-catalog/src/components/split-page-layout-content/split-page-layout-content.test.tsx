import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {SplitPageLayoutContentView} from './split-page-layout-content';

afterEach(cleanup);

const contentEl = (c: HTMLElement) => c.querySelector('[data-component="SplitPageLayout.Content"]');

describe('SplitPageLayoutContentView', () => {
  it('renders the content region and its children', () => {
    const {container} = render(
      <SplitPageLayoutContentView>
        <span>Body copy</span>
      </SplitPageLayoutContentView>,
    );
    expect(contentEl(container)).not.toBeNull();
    expect(screen.getByText('Body copy')).toBeInTheDocument();
  });

  it('renders the region using the `as` element tag', () => {
    const {container} = render(
      <SplitPageLayoutContentView as="section">
        <span>x</span>
      </SplitPageLayoutContentView>,
    );
    expect(
      container.querySelector('section[data-component="SplitPageLayout.Content"]'),
    ).not.toBeNull();
  });

  it('forwards the max content width as a data attribute', () => {
    const {container} = render(
      <SplitPageLayoutContentView width="large">
        <span>x</span>
      </SplitPageLayoutContentView>,
    );
    expect(container.querySelector('[data-width="large"]')).not.toBeNull();
  });

  it('forwards padding as the region spacing token', () => {
    const {container} = render(
      <SplitPageLayoutContentView padding="condensed">
        <span>x</span>
      </SplitPageLayoutContentView>,
    );
    expect(container.innerHTML).toContain('--spacing-condensed');
  });

  it('forwards a scalar hidden as a data attribute (region hidden)', () => {
    const {container} = render(
      <SplitPageLayoutContentView hidden={true}>
        <span>x</span>
      </SplitPageLayoutContentView>,
    );
    expect(contentEl(container)).toHaveAttribute('data-is-hidden', 'true');
  });

  it('applies the accessibility label as aria-label on the main landmark', () => {
    const {container} = render(
      <SplitPageLayoutContentView accessibility={{label: 'Main content'}}>
        <span>x</span>
      </SplitPageLayoutContentView>,
    );
    expect(contentEl(container)).toHaveAttribute('aria-label', 'Main content');
  });
});
