import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Portal} from '@primer/react';
import {Provider} from './provider';

/** jsdom has no matchMedia; the Provider must render without one and default to light. */
function stubAppearance(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

/** The element Primer's color tokens are scoped to. */
const colorModeOf = (container: HTMLElement) =>
  container
    .querySelector('.github-catalog-scope [data-color-mode]')
    ?.getAttribute('data-color-mode');

describe('Provider', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('wraps the fragment in the catalog scope element', () => {
    render(
      <Provider>
        <span>inside</span>
      </Provider>,
    );
    expect(screen.getByText('inside').closest('.github-catalog-scope')).not.toBeNull();
  });

  it('keeps a Primer portal inside the scope element', () => {
    render(
      <Provider>
        <Portal>
          <span>overlay</span>
        </Portal>
      </Provider>,
    );
    expect(screen.getByText('overlay').closest('.github-catalog-scope')).not.toBeNull();
  });

  it('follows the OS appearance, light by default', () => {
    expect(colorModeOf(render(<Provider>x</Provider>).container)).toBe('light');
    stubAppearance(true);
    expect(colorModeOf(render(<Provider>x</Provider>).container)).toBe('dark');
  });
});
