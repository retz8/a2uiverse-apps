/**
 * The catalog's Provider, its one entry into the page: a wrapper element carrying the catalog's
 * class and the OS appearance, and the catalog's stylesheet, loaded on first mount. Every rule,
 * token and the typeface in that sheet is scoped to the wrapper — nothing lands on the document
 * root — so the catalog composes beside any other on one page.
 */
import {useEffect, useState, type ReactNode} from 'react';

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

let themeLoaded: Promise<unknown> | null = null;

function loadTheme() {
  themeLoaded ??= import('./theme.css');
  return themeLoaded;
}

/** Wraps every circleci-catalog surface. `display: contents` keeps the wrapper out of layout. */
export function Provider({children}: {children: ReactNode}) {
  const appearance = useSystemAppearance();
  useEffect(() => {
    void loadTheme();
  }, []);
  return (
    <div className="circleci-catalog" data-appearance={appearance} style={{display: 'contents'}}>
      {children}
    </div>
  );
}
