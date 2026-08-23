import {describe, it, expect, afterEach} from 'vitest';
import {render, cleanup} from '@testing-library/react';
import {ActionBarDividerView} from './actionbar-divider';

afterEach(cleanup);

describe('ActionBarDividerView', () => {
  it('renders an aria-hidden vertical separator element', () => {
    const {container} = render(<ActionBarDividerView />);
    const divider = container.querySelector('[data-component="ActionBar.VerticalDivider"]');
    expect(divider).not.toBeNull();
    expect(divider).toHaveAttribute('aria-hidden', 'true');
  });
});
