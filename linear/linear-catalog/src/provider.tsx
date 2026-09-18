/**
 * The catalog's Provider: Linear's product tokens, written only on the Provider's
 * own wrapper — never `:root`, no global stylesheet — so composition with other catalogs
 * stays collision-free. This is the bundle's one Provider and one CSS setup.
 *
 * The palette is sampled from Linear's own web app, as its documentation screenshots show it
 * (linear.app/docs — the issue list on customer-requests and my-issues, the issue detail on
 * comment-on-issues and parent-and-sub-issues, the status icons on configuring-workflows and
 * label-views, the priority icons on priority and custom-views). Both appearances are measured
 * there; where one appearance had no sample, the other's value is used and says so.
 * Everything not set here falls through to the basic catalog's defaults.
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

/** Linear's text measures as Inter; the bundle loads no font, so Inter is used where installed. */
const FONT_STACK = "Inter, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

let themeLoaded: Promise<unknown> | null = null;

/** The product sheet, scoped to the wrapper class; loaded on first mount, nothing global. */
function loadTheme() {
  themeLoaded ??= import('./theme.css');
  return themeLoaded;
}

/**
 * Shape, type and spacing — appearance-independent. Buttons and selects measure at about a
 * fifth of their height; chips and count pills are fully round. The screenshots fix no absolute
 * type size, so the sizes are the scaffold's.
 */
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
  '--a2ui-button-border-radius': '6px',
  '--a2ui-card-border-radius': '6px',
  '--a2ui-textfield-border-radius': '6px',
  '--a2ui-choicepicker-chip-border-radius': '9999px',
} as const;

/** Light appearance — measured on the light issue list and issue detail. */
const LIGHT = {
  '--a2ui-color-background': '#f3f3f4',
  '--a2ui-color-on-background': '#1b1b1b',
  '--a2ui-color-surface': '#fcfcfc',
  '--a2ui-color-on-surface': '#1b1b1b',
  '--a2ui-color-primary': '#6e78d5',
  '--a2ui-color-on-primary': '#ffffff',
  '--a2ui-color-secondary': '#ededed',
  '--a2ui-color-on-secondary': '#1b1b1b',
  '--a2ui-color-border': '#e0e0e0',
  '--a2ui-color-input': '#fcfcfc',
  '--a2ui-color-on-input': '#1b1b1b',
  // Linear's panels are bordered, not raised: a 1px ring in the divider color.
  '--a2ui-card-box-shadow': '0 0 0 1px #e0e0e0',
  '--a2ui-row-hover': '#f6f6f7',
  '--a2ui-text-caption-color': '#5d5d5f',
  '--linear-link': '#3f60d8',
  // A status icon's check or cross is drawn in the surface color, not cut out.
  '--linear-icon-knockout': '#fcfcfc',
  '--linear-status-backlog': '#959a9f',
  '--linear-status-unstarted': '#b9b9b9',
  '--linear-status-started': '#f0c000',
  // In Review and Canceled were only sampled dark.
  '--linear-status-review': '#27a644',
  '--linear-status-completed': '#5e6ad3',
  '--linear-status-canceled': '#96a2b4',
  '--linear-priority': '#6d6d6e',
  // Urgent was only sampled in a dark list row.
  '--linear-priority-urgent': '#ff7236',
} as const;

/** Dark appearance — measured on the dark issue list, issue detail and priority menu. */
const DARK_TOKENS = {
  '--a2ui-color-background': '#090909',
  '--a2ui-color-on-background': '#e3e4e6',
  '--a2ui-color-surface': '#101011',
  '--a2ui-color-on-surface': '#e3e4e6',
  '--a2ui-color-primary': '#5e6ad2',
  '--a2ui-color-on-primary': '#ffffff',
  '--a2ui-color-secondary': '#17181a',
  '--a2ui-color-on-secondary': '#e3e4e6',
  '--a2ui-color-border': '#27282d',
  '--a2ui-color-input': '#101011',
  '--a2ui-color-on-input': '#e3e4e6',
  '--a2ui-card-box-shadow': '0 0 0 1px #27282d',
  '--a2ui-row-hover': '#151618',
  '--a2ui-text-caption-color': '#97979a',
  // No dark link was sampled undimmed; the light one is used.
  '--linear-link': '#3f60d8',
  '--linear-icon-knockout': '#101011',
  '--linear-status-backlog': '#bec2c8',
  '--linear-status-unstarted': '#e2e2e2',
  '--linear-status-started': '#f1bf00',
  '--linear-status-review': '#27a644',
  '--linear-status-completed': '#5f6ad3',
  '--linear-status-canceled': '#96a2b4',
  '--linear-priority': '#969799',
  '--linear-priority-urgent': '#ff7236',
} as const;

export const TOKENS = {...STRUCTURE, ...LIGHT} as const satisfies Record<`--${string}`, string>;

export const TOKENS_DARK = {...STRUCTURE, ...DARK_TOKENS} as const satisfies Record<
  `--${string}`,
  string
>;

/**
 * Wraps every linear-catalog surface. `display: contents` keeps the wrapper out of layout;
 * custom properties still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const tokens = useSystemAppearance() === 'dark' ? TOKENS_DARK : TOKENS;
  useEffect(() => {
    void loadTheme();
  }, []);
  return (
    <div
      className="linear-catalog"
      style={{display: 'contents', fontFamily: FONT_STACK, ...tokens} as CSSProperties}
    >
      {children}
    </div>
  );
}
