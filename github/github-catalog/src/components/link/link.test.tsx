import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {LinkView} from './link';

afterEach(cleanup);

describe('LinkView', () => {
  it('renders the link text', () => {
    render(<LinkView text="View on GitHub" href="https://github.com" />);
    expect(screen.getByText('View on GitHub')).toBeInTheDocument();
  });

  it('renders an anchor carrying the href', () => {
    render(<LinkView text="View" href="https://github.com" />);
    const el = screen.getByRole('link', {name: 'View'});
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', 'https://github.com');
  });

  it('opens in a new tab when target is _blank', () => {
    render(<LinkView text="View" href="https://github.com" target="_blank" />);
    expect(screen.getByRole('link', {name: 'View'})).toHaveAttribute('target', '_blank');
  });

  it('passes muted/inline to Primer as data-* attributes', () => {
    render(<LinkView text="Styled" href="https://github.com" muted inline />);
    const el = screen.getByRole('link', {name: 'Styled'});
    expect(el).toHaveAttribute('data-muted', 'true');
    expect(el).toHaveAttribute('data-inline', 'true');
  });

  it('exposes an accessible label/description to assistive tech', () => {
    render(
      <LinkView
        text="View"
        href="https://github.com"
        accessibility={{label: 'View the repository on GitHub', description: 'Opens the repo'}}
      />,
    );
    const el = screen.getByRole('link', {name: 'View the repository on GitHub'});
    expect(el).toHaveAttribute('aria-label', 'View the repository on GitHub');
    expect(el).toHaveAttribute('aria-description', 'Opens the repo');
  });
});
