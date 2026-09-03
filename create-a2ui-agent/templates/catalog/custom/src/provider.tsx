/**
 * The catalog's Provider: the bundle's one entry into the page. It wires the design system,
 * brings its own stylesheet, and anchors any portal root — all scoped to the fragment
 * boundary a host mounts it in, never to `:root`. This is the bundle's one Provider and one
 * CSS setup.
 *
 * TODO: wrap `children` in the design system's theme provider, load its token sheets here
 * (rewritten from `:root` to the scope class if they declare there), and register its portal
 * root on the scope element so overlays open themed and inside the boundary.
 */
import {useEffect, type ReactNode} from 'react';

let themeLoaded: Promise<unknown> | null = null;

/** The product sheet, scoped to the scope class; loaded on first mount, nothing global. */
function loadTheme() {
  themeLoaded ??= import('./theme.css');
  return themeLoaded;
}

export function Provider({children}: {children: ReactNode}) {
  useEffect(() => {
    void loadTheme();
  }, []);
  return (
    <div className="__PACKAGE_NAME__-scope" data-portal-root>
      {children}
    </div>
  );
}
