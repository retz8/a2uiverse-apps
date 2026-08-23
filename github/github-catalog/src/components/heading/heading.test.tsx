import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {HeadingView} from './heading';

afterEach(cleanup);

describe('HeadingView', () => {
  it('renders the text content', () => {
    render(<HeadingView text="Section title" />);
    expect(screen.getByText('Section title')).toBeInTheDocument();
  });

  it('renders as an h2 by default', () => {
    render(<HeadingView text="Default level" />);
    expect(screen.getByText('Default level').tagName).toBe('H2');
  });

  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)('honors the as prop (%s)', level => {
    render(<HeadingView text={level} as={level} />);
    expect(screen.getByText(level).tagName).toBe(level.toUpperCase());
  });

  it('passes variant to Primer as a data-variant attribute', () => {
    render(<HeadingView text="Sized" variant="large" />);
    expect(screen.getByText('Sized')).toHaveAttribute('data-variant', 'large');
  });
});
