import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {TextView} from './text';

afterEach(cleanup);

describe('TextView', () => {
  it('renders the text content', () => {
    render(<TextView text="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as a span by default', () => {
    render(<TextView text="Hi" />);
    expect(screen.getByText('Hi').tagName).toBe('SPAN');
  });

  it('honors the as prop', () => {
    render(<TextView text="Para" as="p" />);
    expect(screen.getByText('Para').tagName).toBe('P');
  });

  it('passes size/weight/whiteSpace to Primer as data-* attributes', () => {
    render(<TextView text="Styled" size="large" weight="semibold" whiteSpace="nowrap" />);
    const el = screen.getByText('Styled');
    expect(el).toHaveAttribute('data-size', 'large');
    expect(el).toHaveAttribute('data-weight', 'semibold');
    expect(el).toHaveAttribute('data-white-space', 'nowrap');
  });
});
