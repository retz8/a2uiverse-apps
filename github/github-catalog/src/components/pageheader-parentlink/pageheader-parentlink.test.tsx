import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {PageHeaderParentLinkView} from './pageheader-parentlink';

afterEach(cleanup);

describe('PageHeaderParentLinkView', () => {
  it('renders its text as the link label', () => {
    render(<PageHeaderParentLinkView text="Issues" href="/issues" />);
    expect(screen.getByRole('link', {name: 'Issues'})).toBeInTheDocument();
  });

  it('forwards href to the anchor', () => {
    render(<PageHeaderParentLinkView text="Issues" href="/issues" />);
    expect(screen.getByRole('link', {name: 'Issues'})).toHaveAttribute('href', '/issues');
  });

  it('forwards aria-label', () => {
    const {container} = render(
      <PageHeaderParentLinkView text="Issues" href="/issues" ariaLabel="Back to issues" />,
    );
    expect(container.querySelector('[aria-label="Back to issues"]')).toBeInTheDocument();
  });
});
