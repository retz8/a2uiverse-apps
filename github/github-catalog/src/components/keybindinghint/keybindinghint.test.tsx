import {describe, it, expect, afterEach} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import {KeybindingHintView} from './keybindinghint';

afterEach(cleanup);

describe('KeybindingHintView', () => {
  it('renders the keys as a kbd element', () => {
    render(<KeybindingHintView keys="Mod+k" />);
    const hint = screen.getByTestId('keybinding-hint');
    expect(hint).toBeInTheDocument();
    expect(hint.tagName).toBe('KBD');
    // The component expands key names for screen readers; "Mod" resolves to the
    // platform primary modifier (control on non-mac) plus the literal key.
    expect(hint.textContent).toContain('control');
    expect(hint.textContent).toContain('k');
  });

  it('spells the keys out in the full format', () => {
    render(<KeybindingHintView keys="Mod+Shift+k" format="full" />);
    const hint = screen.getByTestId('keybinding-hint');
    // full form joins spelled-out chords with a visible separator.
    expect(hint.textContent).toContain('Control');
    expect(hint.textContent).toContain('Shift');
    expect(hint.textContent).toContain('+');
  });

  it('honors the variant (color treatment class on the chord)', () => {
    const {container} = render(<KeybindingHintView keys="Mod+k" variant="onEmphasis" />);
    expect(container.querySelector('[class*="ChordOnEmphasis"]')).toBeInTheDocument();
  });

  it('honors the small size', () => {
    const {container} = render(<KeybindingHintView keys="Mod+k" size="small" />);
    expect(container.querySelector('[class*="ChordSmall"]')).toBeInTheDocument();
  });
});
