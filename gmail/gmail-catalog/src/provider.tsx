/**
 * The catalog's Provider: Gmail's Material 3 product tokens, written only on the Provider's
 * own wrapper — never `:root`, no stylesheet, nothing global — so composition with other
 * catalogs stays collision-free.
 *
 * The bundle sets the base tier (colour, shape, type, spacing) plus the short list of
 * per-component tokens that carry Material 3 Expressive's signature: pill buttons, the
 * card-on-lighter-ground, and the rounded field and chip. Everything else falls through to
 * the basic catalog's own defaults.
 */
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';

const DARK = '(prefers-color-scheme: dark)';

/**
 * Follow the OS appearance, as the shell does. The canvas resolves its own appearance from
 * this same media query, so a fragment tracks the surface it is mounted into without reading
 * anything the shell owns.
 */
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

/**
 * Google Sans is not distributed as a web font, so it is preferred where the platform has it
 * and falls back through Roboto to the system stack. The bundle loads no font.
 */
const FONT_STACK =
  "'Google Sans', 'Google Sans Text', Roboto, -apple-system, 'Helvetica Neue', Arial, sans-serif";

/** Material 3 elevation level 1 — what lifts Gmail's message list off its ground. */
const ELEVATION_1 = '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)';
const ELEVATION_1_DARK = '0 1px 2px 0 rgba(0, 0, 0, 0.6), 0 1px 3px 1px rgba(0, 0, 0, 0.3)';

/** Shape, type and spacing — appearance-independent. */
const STRUCTURE = {
  '--a2ui-border-radius': '12px',
  '--a2ui-font-family-title': FONT_STACK,
  '--a2ui-font-size-xs': '0.6875rem',
  '--a2ui-font-size-s': '0.75rem',
  '--a2ui-font-size-m': '0.875rem',
  '--a2ui-font-size-l': '1rem',
  '--a2ui-font-size-xl': '1.375rem',
  '--a2ui-font-size-2xl': '1.75rem',
  '--a2ui-line-height-body': '1.5',
  '--a2ui-line-height-headings': '1.27',
  '--a2ui-spacing-xs': '0.25rem',
  '--a2ui-spacing-s': '0.5rem',
  '--a2ui-spacing-m': '0.75rem',
  '--a2ui-spacing-l': '1.25rem',
  // The Material 3 Expressive signature: a fully rounded button, the raised card, and the
  // rounded field and chip. Set deliberately rather than composed out of extra structure.
  '--a2ui-button-border-radius': '9999px',
  '--a2ui-card-border-radius': '16px',
  '--a2ui-textfield-border-radius': '8px',
  '--a2ui-choicepicker-chip-border-radius': '8px',
} as const;

/** Material 3 light: the message list as a white card on a tinted neutral ground. */
const LIGHT = {
  '--a2ui-color-background': '#f8fafd',
  '--a2ui-color-on-background': '#1f1f1f',
  '--a2ui-color-surface': '#ffffff',
  '--a2ui-color-on-surface': '#1f1f1f',
  '--a2ui-color-primary': '#0b57d0',
  '--a2ui-color-on-primary': '#ffffff',
  '--a2ui-color-secondary': '#d3e3fd',
  '--a2ui-color-on-secondary': '#041e49',
  '--a2ui-color-border': '#c4c7c5',
  '--a2ui-color-input': '#ffffff',
  '--a2ui-color-on-input': '#1f1f1f',
  '--a2ui-card-box-shadow': ELEVATION_1,
} as const;

/** Material 3 dark, on the same roles. */
const DARK_TOKENS = {
  '--a2ui-color-background': '#131314',
  '--a2ui-color-on-background': '#e3e3e3',
  '--a2ui-color-surface': '#1e1f20',
  '--a2ui-color-on-surface': '#e3e3e3',
  '--a2ui-color-primary': '#a8c7fa',
  '--a2ui-color-on-primary': '#062e6f',
  '--a2ui-color-secondary': '#0842a0',
  '--a2ui-color-on-secondary': '#d3e3fd',
  '--a2ui-color-border': '#444746',
  '--a2ui-color-input': '#1e1f20',
  '--a2ui-color-on-input': '#e3e3e3',
  '--a2ui-card-box-shadow': ELEVATION_1_DARK,
} as const;

export const GMAIL_TOKENS = {...STRUCTURE, ...LIGHT} as const satisfies Record<
  `--a2ui-${string}`,
  string
>;

export const GMAIL_TOKENS_DARK = {...STRUCTURE, ...DARK_TOKENS} as const satisfies Record<
  `--a2ui-${string}`,
  string
>;

/**
 * Wraps every gmail-catalog surface. `display: contents` keeps the wrapper out of layout;
 * custom properties still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const tokens = useSystemAppearance() === 'dark' ? GMAIL_TOKENS_DARK : GMAIL_TOKENS;
  return (
    <div
      className="gmail-catalog"
      style={{display: 'contents', fontFamily: FONT_STACK, ...tokens} as CSSProperties}
    >
      {children}
    </div>
  );
}
