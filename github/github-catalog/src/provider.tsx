/**
 * The catalog's Provider: Primer's theme + base styles around a surface mount, with Primer's
 * token stylesheets loaded on first mount. The bundle owns this setup — a host wraps each of
 * this catalog's fragments in it and nothing Primer reaches the page until one renders.
 *
 * Everything the bundle brings stays inside the fragment boundary: token sheets that would
 * declare at `:root` ship as a generated copy scoped to the Provider's own scope element
 * (`scripts/build-scoped-css.mjs`), and Primer's portal root is anchored inside that element so
 * overlays mount themed, inside the boundary, instead of at `document.body`.
 */
import {useEffect, type ReactNode} from 'react';
import {BaseStyles, ThemeProvider, registerPortalRoot} from '@primer/react';

let tokensLoaded: Promise<unknown> | null = null;

/**
 * Primer functional color tokens (--fgColor-*, etc.), scoped by Primer to the data-color-mode
 * attributes ThemeProvider sets, plus the generated scope-element sheet (motion + border/focus
 * tokens). Without the color tokens Icon fills compute to black, without the motion tokens
 * Spinner's animation shorthand is dropped, and the border/focus tokens are what the functional
 * sheets read.
 */
function loadPrimerTokens() {
  tokensLoaded ??= Promise.all([
    import('@primer/primitives/dist/css/functional/themes/light.css'),
    import('@primer/primitives/dist/css/functional/themes/dark.css'),
    import('./primer-scoped.css'),
  ]);
  return tokensLoaded;
}

/**
 * Primer keeps one module-global default portal root; each mounting Provider claims it. The
 * anchor renders before the fragment's children so the registration lands before any overlay in
 * the same commit resolves its root; `data-portal-root` on the scope element catches Primer's
 * recovery path (a claimed root no longer in the document) inside the boundary too.
 */
const anchorPortalRoot = (el: HTMLDivElement | null) => {
  if (el) registerPortalRoot(el);
};

export function Provider({children}: {children: ReactNode}) {
  useEffect(() => {
    void loadPrimerTokens();
  }, []);
  return (
    <div className="github-catalog-scope" data-portal-root>
      <ThemeProvider>
        <BaseStyles>
          <div ref={anchorPortalRoot} />
          {children}
        </BaseStyles>
      </ThemeProvider>
    </div>
  );
}
