/**
 * The catalog's Provider: Primer's theme + base styles around a surface mount, with Primer's
 * token stylesheets loaded on first mount. The bundle owns this setup — a host wraps each of
 * this catalog's fragments in it and nothing Primer reaches the page until one renders.
 * The stylesheets are page-global custom properties once loaded (scoping to the fragment
 * wrapper is a later step).
 */
import {useEffect, type ReactNode} from 'react';
import {BaseStyles, ThemeProvider} from '@primer/react';

let tokensLoaded: Promise<unknown> | null = null;

/**
 * Primer functional color tokens (--fgColor-*, etc.) and base motion tokens (--base-duration-*).
 * ThemeProvider sets the data-color-mode attributes these are scoped to, but the custom
 * properties ship as CSS in @primer/primitives; without the color tokens Icon fills compute to
 * black, without the motion tokens Spinner's animation shorthand is dropped.
 */
function loadPrimerTokens() {
  tokensLoaded ??= Promise.all([
    import('@primer/primitives/dist/css/functional/themes/light.css'),
    import('@primer/primitives/dist/css/functional/themes/dark.css'),
    import('@primer/primitives/dist/css/base/motion/motion.css'),
  ]);
  return tokensLoaded;
}

export function Provider({children}: {children: ReactNode}) {
  useEffect(() => {
    void loadPrimerTokens();
  }, []);
  return (
    <ThemeProvider>
      <BaseStyles>{children}</BaseStyles>
    </ThemeProvider>
  );
}
