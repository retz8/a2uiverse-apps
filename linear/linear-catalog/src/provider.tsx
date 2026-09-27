/**
 * The catalog's Provider: the palette's tokens and the typeface, written only on the Provider's
 * own wrapper — never `:root`, no global stylesheet — so composition with other catalogs stays
 * collision-free. This is the bundle's one Provider and one CSS setup.
 */
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import {INPUTS, generateTheme, type Appearance} from './palette.js';

const DARK = '(prefers-color-scheme: dark)';

/** Follow the OS appearance, from the same media query a host canvas reads. */
function useSystemAppearance(): Appearance {
  const [appearance, setAppearance] = useState<Appearance>(() =>
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

/** Inter, shipped with the bundle under a family name the catalog owns (see theme.css). */
export const FONT_STACK =
  "'linear-catalog-inter', Inter, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const TOKENS = generateTheme(INPUTS.light, 'light');

export const TOKENS_DARK = generateTheme(INPUTS.dark, 'dark');

let themeLoaded: Promise<unknown> | null = null;

/** The sheet, scoped to the wrapper class, and its font face; loaded on first mount. */
function loadTheme() {
  themeLoaded ??= import('./theme.css');
  return themeLoaded;
}

/**
 * Wraps every linear-catalog surface. `display: contents` keeps the wrapper out of layout; the
 * tokens and the type still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const appearance = useSystemAppearance();
  const tokens = appearance === 'dark' ? TOKENS_DARK : TOKENS;
  useEffect(() => {
    void loadTheme();
  }, []);
  return (
    <div
      className="linear-catalog"
      data-appearance={appearance}
      style={{display: 'contents', fontFamily: FONT_STACK, ...tokens} as CSSProperties}
    >
      {children}
    </div>
  );
}
