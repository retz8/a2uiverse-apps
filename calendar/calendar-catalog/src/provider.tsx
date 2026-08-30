/**
 * The catalog's Provider: Google Calendar's Material 3 product tokens, written only on the
 * Provider's own wrapper — never `:root`, no stylesheet, nothing global — so composition with
 * other catalogs stays collision-free.
 *
 * Calendar and Gmail are the same design system by the same company, so a theme that merely
 * restated Material 3 would leave two of the phase's three fragments reading as one product,
 * and phase acceptance item 6 mechanically green but observably meaningless. This theme is
 * therefore built on where Calendar genuinely differs from Gmail (task-2.7 decision 3):
 *
 *   - a dense agenda on a flat ground, not cards floating on a tinted one — so the card trades
 *     its elevation for a hairline rule, and the layout gaps tighten
 *   - a smaller type scale and a tighter spacing scale, because an agenda row packs a time, a
 *     title and a location into the height Gmail gives a sender and a subject
 *   - a per-event calendar colour as the accent rather than one product blue
 *
 * What the two products genuinely share stays shared: the pill button, the Google Sans stack,
 * and the rounded field and chip are Material 3's signature in both, and faking a difference
 * there would invent contrast rather than carry it.
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

let themeLoaded: Promise<unknown> | null = null;

/** The product sheet, scoped to the wrapper class; loaded on first mount, nothing global. */
function loadTheme() {
  themeLoaded ??= import('./theme.css');
  return themeLoaded;
}

/** Shape, type, spacing and density — appearance-independent. */
const STRUCTURE = {
  '--a2ui-border-radius': '8px',
  '--a2ui-font-family-title': FONT_STACK,
  // A smaller scale than Gmail's: an agenda row carries more fields in less height.
  '--a2ui-font-size-xs': '0.625rem',
  '--a2ui-font-size-s': '0.6875rem',
  '--a2ui-font-size-m': '0.8125rem',
  '--a2ui-font-size-l': '0.9375rem',
  '--a2ui-font-size-xl': '1.25rem',
  '--a2ui-font-size-2xl': '1.5rem',
  '--a2ui-line-height-body': '1.4',
  '--a2ui-line-height-headings': '1.25',
  // Tighter than Gmail's throughout.
  '--a2ui-spacing-xs': '0.125rem',
  '--a2ui-spacing-s': '0.375rem',
  '--a2ui-spacing-m': '0.5rem',
  '--a2ui-spacing-l': '0.875rem',
  // Shared with Gmail, because Material 3 genuinely shares them.
  '--a2ui-button-border-radius': '9999px',
  '--a2ui-textfield-border-radius': '8px',
  '--a2ui-choicepicker-chip-border-radius': '8px',
  // Calendar's own: a modestly rounded surface, not Gmail's 16px card.
  '--a2ui-card-border-radius': '8px',
  // Density. These fall back to the spacing scale when unset; they are set explicitly because
  // an agenda is denser than the scale alone would make it, and the card sits flush inside its
  // fragment rather than floating on a margin of its own.
  '--a2ui-card-padding': '0.75rem',
  '--a2ui-card-margin': '0rem',
  '--a2ui-list-gap': '0.125rem',
  '--a2ui-column-gap': '0.375rem',
  '--a2ui-row-gap': '0.5rem',
  '--a2ui-divider-spacing': '0.375rem',
} as const;

/** Calendar light: a flat white ground, hairline-ruled, with the Peacock event accent. */
const LIGHT = {
  '--a2ui-color-background': '#ffffff',
  '--a2ui-color-on-background': '#1f1f1f',
  '--a2ui-color-surface': '#ffffff',
  '--a2ui-color-on-surface': '#1f1f1f',
  '--a2ui-color-primary': '#039be5',
  '--a2ui-color-on-primary': '#ffffff',
  '--a2ui-color-secondary': '#e1f5fe',
  '--a2ui-color-on-secondary': '#01579b',
  '--a2ui-color-border': '#dadce0',
  '--a2ui-color-input': '#ffffff',
  '--a2ui-color-on-input': '#1f1f1f',
  // The card is defined by its rule, not by lift — the inverse of Gmail's elevation-1.
  '--a2ui-card-box-shadow': 'none',
  '--a2ui-card-border': '1px solid #dadce0',
  '--a2ui-text-caption-color': '#5f6368',
} as const;

/** Calendar dark, on the same roles. */
const DARK_TOKENS = {
  '--a2ui-color-background': '#131314',
  '--a2ui-color-on-background': '#e3e3e3',
  '--a2ui-color-surface': '#1e1f20',
  '--a2ui-color-on-surface': '#e3e3e3',
  '--a2ui-color-primary': '#81d4fa',
  '--a2ui-color-on-primary': '#01579b',
  '--a2ui-color-secondary': '#01579b',
  '--a2ui-color-on-secondary': '#e1f5fe',
  '--a2ui-color-border': '#3c4043',
  '--a2ui-color-input': '#1e1f20',
  '--a2ui-color-on-input': '#e3e3e3',
  '--a2ui-card-box-shadow': 'none',
  '--a2ui-card-border': '1px solid #3c4043',
  '--a2ui-text-caption-color': '#9aa0a6',
} as const;

export const CALENDAR_TOKENS = {...STRUCTURE, ...LIGHT} as const satisfies Record<
  `--a2ui-${string}`,
  string
>;

export const CALENDAR_TOKENS_DARK = {...STRUCTURE, ...DARK_TOKENS} as const satisfies Record<
  `--a2ui-${string}`,
  string
>;

/**
 * Wraps every calendar-catalog surface. `display: contents` keeps the wrapper out of layout;
 * custom properties still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const tokens = useSystemAppearance() === 'dark' ? CALENDAR_TOKENS_DARK : CALENDAR_TOKENS;
  useEffect(() => {
    void loadTheme();
  }, []);
  return (
    <div
      className="calendar-catalog"
      style={{display: 'contents', fontFamily: FONT_STACK, ...tokens} as CSSProperties}
    >
      {children}
    </div>
  );
}
