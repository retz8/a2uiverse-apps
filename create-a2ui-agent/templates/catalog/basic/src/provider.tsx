/**
 * The catalog's Provider: __DISPLAY_NAME__'s product tokens, written only on the Provider's
 * own wrapper — never `:root`, no global stylesheet — so composition with other catalogs
 * stays collision-free. This is the bundle's one Provider and one CSS setup.
 *
 * TODO: the token values below are a neutral starting palette. Replace them with the
 * product's colour, shape, type and spacing (the `design-catalog-component` skill's token
 * table is the place to design them); everything not set here falls through to the basic
 * catalog's own defaults.
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

/** TODO: the product's type stack. The bundle loads no font. */
const FONT_STACK = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

let themeLoaded: Promise<unknown> | null = null;

/** The product sheet, scoped to the wrapper class; loaded on first mount, nothing global. */
function loadTheme() {
  themeLoaded ??= import('./theme.css');
  return themeLoaded;
}

/** Shape, type and spacing — appearance-independent. */
const STRUCTURE = {
  '--a2ui-border-radius': '8px',
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
  '--a2ui-color-primary': '#2f5bea',
  '--a2ui-color-on-primary': '#ffffff',
  '--a2ui-color-secondary': '#e4eaff',
  '--a2ui-color-on-secondary': '#12245e',
  '--a2ui-color-border': '#d0d4da',
  '--a2ui-color-input': '#ffffff',
  '--a2ui-color-on-input': '#1c1e21',
  '--a2ui-card-box-shadow': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  '--a2ui-row-hover': '#eef1f6',
  '--a2ui-text-caption-color': '#5f6673',
} as const;

/** Dark appearance, on the same roles. */
const DARK_TOKENS = {
  '--a2ui-color-background': '#121418',
  '--a2ui-color-on-background': '#e6e8eb',
  '--a2ui-color-surface': '#1d2026',
  '--a2ui-color-on-surface': '#e6e8eb',
  '--a2ui-color-primary': '#9db3ff',
  '--a2ui-color-on-primary': '#0d1d5a',
  '--a2ui-color-secondary': '#2a3c7a',
  '--a2ui-color-on-secondary': '#e4eaff',
  '--a2ui-color-border': '#3a3f47',
  '--a2ui-color-input': '#1d2026',
  '--a2ui-color-on-input': '#e6e8eb',
  '--a2ui-card-box-shadow': '0 1px 2px 0 rgba(0, 0, 0, 0.6)',
  '--a2ui-row-hover': '#262a31',
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
 * Wraps every __PACKAGE_NAME__ surface. `display: contents` keeps the wrapper out of layout;
 * custom properties still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const tokens = useSystemAppearance() === 'dark' ? TOKENS_DARK : TOKENS;
  useEffect(() => {
    void loadTheme();
  }, []);
  return (
    <div
      className="__PACKAGE_NAME__"
      style={{display: 'contents', fontFamily: FONT_STACK, ...tokens} as CSSProperties}
    >
      {children}
    </div>
  );
}
