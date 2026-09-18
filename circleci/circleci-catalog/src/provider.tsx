/**
 * The catalog's Provider: CircleCI's product tokens, written only on the Provider's
 * own wrapper — never `:root`, no global stylesheet — so composition with other catalogs
 * stays collision-free. This is the bundle's one Provider and one CSS setup.
 *
 * The palette is sampled from CircleCI's own web app, as its documentation screenshots show
 * it (circleci/circleci-docs, `docs/guides/modules/ROOT/images/`): the pipelines page, a
 * workflow page, and a failed job's step. Light values are measured there; the dark
 * appearance takes its surfaces from the same screens' navy header (#1c273a) and log panel
 * (#121722, #1d2639). Everything not set here falls through to the basic catalog's defaults.
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

/** A system stack: the bundle loads no font. */
const FONT_STACK = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

let themeLoaded: Promise<unknown> | null = null;

/** The product sheet, scoped to the wrapper class; loaded on first mount, nothing global. */
function loadTheme() {
  themeLoaded ??= import('./theme.css');
  return themeLoaded;
}

/** Shape, type and spacing — appearance-independent. */
const STRUCTURE = {
  '--a2ui-border-radius': '6px',
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
  '--a2ui-button-border-radius': '9999px',
  '--a2ui-card-border-radius': '8px',
  '--a2ui-textfield-border-radius': '6px',
  '--a2ui-choicepicker-chip-border-radius': '6px',
} as const;

/** Light appearance — measured on CircleCI's pipelines, workflow and job pages. */
const LIGHT = {
  '--a2ui-color-background': '#f7f7f7',
  '--a2ui-color-on-background': '#161616',
  '--a2ui-color-surface': '#ffffff',
  '--a2ui-color-on-surface': '#161616',
  '--a2ui-color-primary': '#3265ee',
  '--a2ui-color-on-primary': '#ffffff',
  '--a2ui-color-secondary': '#e3e3e3',
  '--a2ui-color-on-secondary': '#161616',
  '--a2ui-color-border': '#e3e3e3',
  '--a2ui-color-input': '#ffffff',
  '--a2ui-color-on-input': '#161616',
  // CircleCI's panels are bordered, not raised: a 1px ring in the border color.
  '--a2ui-card-box-shadow': '0 0 0 1px #e3e3e3',
  '--a2ui-row-hover': '#e8e9eb',
  '--a2ui-text-caption-color': '#6a6a6a',
} as const;

/** Dark appearance, on the same roles: the header's navy and the log panel's surfaces. */
const DARK_TOKENS = {
  '--a2ui-color-background': '#121722',
  '--a2ui-color-on-background': '#e5e5e5',
  '--a2ui-color-surface': '#1c273a',
  '--a2ui-color-on-surface': '#e5e5e5',
  '--a2ui-color-primary': '#7d9cf5',
  '--a2ui-color-on-primary': '#121722',
  '--a2ui-color-secondary': '#1d2639',
  '--a2ui-color-on-secondary': '#e5e5e5',
  '--a2ui-color-border': '#2c3850',
  '--a2ui-color-input': '#1d2639',
  '--a2ui-color-on-input': '#e5e5e5',
  '--a2ui-card-box-shadow': '0 0 0 1px #2c3850',
  '--a2ui-row-hover': '#1d2639',
  '--a2ui-text-caption-color': '#a3a9b5',
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
 * Wraps every circleci-catalog surface. `display: contents` keeps the wrapper out of layout;
 * custom properties still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const tokens = useSystemAppearance() === 'dark' ? TOKENS_DARK : TOKENS;
  useEffect(() => {
    void loadTheme();
  }, []);
  return (
    <div
      className="circleci-catalog"
      style={{display: 'contents', fontFamily: FONT_STACK, ...tokens} as CSSProperties}
    >
      {children}
    </div>
  );
}
