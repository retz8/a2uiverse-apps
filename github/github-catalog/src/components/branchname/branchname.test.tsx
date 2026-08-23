import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {BranchNameView} from './branchname';

afterEach(cleanup);

describe('BranchNameView', () => {
  it('renders the branch name text', () => {
    render(<BranchNameView text="main" />);
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('renders as an anchor by default', () => {
    render(<BranchNameView text="main" />);
    expect(screen.getByText('main').tagName).toBe('A');
  });

  it('carries the href on the rendered anchor', () => {
    render(<BranchNameView text="main" href="https://example.com/tree/main" />);
    expect(screen.getByText('main')).toHaveAttribute('href', 'https://example.com/tree/main');
  });

  it('honors the as prop (span for contextual references)', () => {
    render(<BranchNameView text="feature/login" as="span" />);
    expect(screen.getByText('feature/login').tagName).toBe('SPAN');
  });
});
