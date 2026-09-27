/**
 * The catalog's Provider: the wrapper that scopes the catalog's sheets — its Material 3 tokens,
 * its components' styles and its typeface — and carries the appearance. Nothing is written to
 * `:root`, so composition with other catalogs stays collision-free. This is the bundle's one
 * Provider and one CSS setup.
 */
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';

export type Appearance = 'light' | 'dark';

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

/** Google Sans, shipped with the bundle under a family name the catalog owns (see styles.css). */
export const FONT_STACK =
  "'gmail-catalog-sans', Roboto, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

let sheetsLoaded: Promise<unknown> | null = null;

/** The token sheet and the component sheet, both scoped to the wrapper class; loaded on first mount. */
function loadSheets() {
  sheetsLoaded ??= Promise.all([import('./tokens.css'), import('./styles.css')]);
  return sheetsLoaded;
}

/**
 * Wraps every gmail-catalog surface. `display: contents` keeps the wrapper out of layout; the
 * tokens and the type still cascade to the subtree.
 */
export function Provider({children}: {children: ReactNode}) {
  const appearance = useSystemAppearance();
  useEffect(() => {
    void loadSheets();
  }, []);
  return (
    <div
      className="gmail-catalog"
      data-appearance={appearance}
      style={{display: 'contents', fontFamily: FONT_STACK} as CSSProperties}
    >
      {children}
    </div>
  );
}
