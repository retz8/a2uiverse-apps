/**
 * The catalog's Provider: Shop A's product tokens, written only on the Provider's
 * own wrapper — never `:root`, no global stylesheet — so composition with other catalogs
 * stays collision-free. This is the bundle's one Provider and one CSS setup.
 *
 * The palette is the scaffold's neutral one with one deliberate change: the accent, on the
 * primary colour and on the secondary ones a default button draws in — its text the accent, its
 * hover a tint of it. The two mock stores sit side by side under a merged view, and a reader has
 * to be able to see that two distinct sources produced it rather than one panel being
 * reformatted (task-4.6 decision 6). Everything not set here falls through to the basic
 * catalog's defaults.
 */
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';

const DARK = '(prefers-color-scheme: dark)';

/** Follow the OS appearance, from the same media query a host canvas reads. */
function useSystemAppearance(): 'light' | 'dark' {
  const [appearance, setAppearance] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia?.(DARK).matches ? 'dark' : 'light',
  );
  useEffect(() => {
    const query = window.matchMedia?.(DARK);
    if (!query) return;
    const onChange = () => setAppearance(query.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return appearance;
}

/** The system stack: a mock ships no font, and its type is not what is being looked at. */
const FONT_STACK = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Shape, type and spacing — appearance-independent. */
const STRUCTURE = {
  '--a2ui-border-radius': '8px',
  '--a2ui-font-family-title': FONT_STACK,
  '--a2ui-font-size-xs': '0.6875rem',
  '--a2ui-font-size-s': '0.75rem',
  '--a2ui-font-size-m': '0.875rem',
  // An `h3` at the size it has always drawn: the browser's own heading, 1.17 times the body.
  '--a2ui-font-size-l': '1.17rem',
  '--a2ui-font-size-xl': '1.375rem',
  '--a2ui-font-size-2xl': '1.75rem',
  '--a2ui-line-height-body': '1.5',
  '--a2ui-line-height-headings': '1.27',
  '--a2ui-spacing-xs': '0.25rem',
  '--a2ui-spacing-s': '0.5rem',
  '--a2ui-spacing-m': '0.75rem',
  '--a2ui-spacing-l': '1.25rem',
  // A list flush with what is above it, as it has always drawn.
  '--a2ui-list-padding': '0',
  '--a2ui-button-border-radius': '8px',
  '--a2ui-card-border-radius': '12px',
  '--a2ui-textfield-border-radius': '6px',
  '--a2ui-choicepicker-chip-border-radius': '6px',
} as const;

/** Light appearance. */
const LIGHT = {
  '--a2ui-color-background': '#f6f7f9',
  '--a2ui-color-on-background': '#1c1e21',
  '--a2ui-color-surface': '#ffffff',
  '--a2ui-color-on-surface': '#1c1e21',
  '--a2ui-color-primary': '#8a5a2b',
  '--a2ui-color-on-primary': '#ffffff',
  '--a2ui-color-secondary': '#f4efe8',
  '--a2ui-color-on-secondary': '#8a5a2b',
  '--a2ui-color-border': '#d0d4da',
  '--a2ui-color-input': '#ffffff',
  '--a2ui-color-on-input': '#1c1e21',
  '--a2ui-card-box-shadow': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  '--a2ui-text-caption-color': '#5f6673',
} as const;

/** Dark appearance, on the same roles. */
const DARK_TOKENS = {
  '--a2ui-color-background': '#121418',
  '--a2ui-color-on-background': '#e6e8eb',
  '--a2ui-color-surface': '#1d2026',
  '--a2ui-color-on-surface': '#e6e8eb',
  '--a2ui-color-primary': '#d69a5f',
  '--a2ui-color-on-primary': '#0d1d5a',
  '--a2ui-color-secondary': '#423831',
  '--a2ui-color-on-secondary': '#d69a5f',
  '--a2ui-color-border': '#3a3f47',
  '--a2ui-color-input': '#1d2026',
  '--a2ui-color-on-input': '#e6e8eb',
  '--a2ui-card-box-shadow': '0 1px 2px 0 rgba(0, 0, 0, 0.6)',
  '--a2ui-text-caption-color': '#a4aab3',
} as const;

export const TOKENS = {...STRUCTURE, ...LIGHT} as const satisfies Record<
  `--a2ui-${string}`,
  string
>;

export const TOKENS_DARK = {...STRUCTURE, ...DARK_TOKENS} as const satisfies Record<
  `--a2ui-${string}`,
  string
>;

/**
 * Wraps every shop-a-catalog surface. `display: contents` keeps the wrapper out of layout;
 * custom properties still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const tokens = useSystemAppearance() === 'dark' ? TOKENS_DARK : TOKENS;
  return (
    <div
      className="shop-a-catalog"
      style={{display: 'contents', fontFamily: FONT_STACK, ...tokens} as CSSProperties}
    >
      {children}
    </div>
  );
}
