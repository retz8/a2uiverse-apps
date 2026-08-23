import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderTitleView} from './pageheader-title';

afterEach(cleanup);

describe('PageHeaderTitleView', () => {
  it('renders its text as a heading', () => {
    render(<PageHeaderTitleView text="Pull request #42" />);
    expect(screen.getByText('Pull request #42')).toBeInTheDocument();
  });

  it('renders as an h2 by default', () => {
    const {container} = render(<PageHeaderTitleView text="T" />);
    expect(container.querySelector('h2')).toBeInTheDocument();
  });

  it('renders as the given heading level', () => {
    const {container} = render(<PageHeaderTitleView text="T" as="h3" />);
    expect(container.querySelector('h3')).toBeInTheDocument();
  });
});
