import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {AvatarView} from './avatar';

const SRC = 'https://example.com/octocat.png';

afterEach(cleanup);

describe('AvatarView', () => {
  it('renders an image carrying its src and alt', () => {
    render(<AvatarView src={SRC} alt="Octocat" />);
    const img = screen.getByRole('img', {name: 'Octocat'});
    expect(img).toHaveAttribute('src', SRC);
  });

  it('honors the size in pixels (width/height)', () => {
    render(<AvatarView src={SRC} alt="Octocat" size={48} />);
    const img = screen.getByRole('img', {name: 'Octocat'});
    expect(img).toHaveAttribute('width', '48');
    expect(img).toHaveAttribute('height', '48');
  });

  it('renders a square avatar when square is set', () => {
    render(<AvatarView src={SRC} alt="Octocat" square />);
    expect(screen.getByRole('img', {name: 'Octocat'})).toHaveAttribute('data-square', '');
  });
});
