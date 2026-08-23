import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {TruncateView} from './truncate';

afterEach(cleanup);

const LONG = 'src/components/navigation/PrimaryNavigationMenu.tsx';

describe('TruncateView', () => {
  it('renders the truncated text content', () => {
    render(<TruncateView text={LONG} title={LONG} />);
    expect(screen.getByText(LONG)).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<TruncateView text={LONG} title={LONG} />);
    expect(screen.getByText(LONG).tagName).toBe('DIV');
  });

  it('carries the full text as the title attribute (accessibility channel)', () => {
    render(<TruncateView text={LONG} title={LONG} />);
    expect(screen.getByText(LONG)).toHaveAttribute('title', LONG);
  });

  it('stamps data-inline when inline is set', () => {
    render(<TruncateView text={LONG} title={LONG} inline />);
    expect(screen.getByText(LONG)).toHaveAttribute('data-inline', 'true');
  });

  it('stamps data-expandable when expandable is set', () => {
    render(<TruncateView text={LONG} title={LONG} expandable />);
    expect(screen.getByText(LONG)).toHaveAttribute('data-expandable', 'true');
  });

  it('applies maxWidth as the truncation CSS variable', () => {
    render(<TruncateView text={LONG} title={LONG} maxWidth="300px" />);
    expect(screen.getByText(LONG).style.getPropertyValue('--truncate-max-width')).toBe('300px');
  });

  it('honors the as prop', () => {
    render(<TruncateView text="span text" title="span text" as="span" />);
    expect(screen.getByText('span text').tagName).toBe('SPAN');
  });
});
