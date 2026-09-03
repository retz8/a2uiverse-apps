/**
 * The registry: every component Api and every function the catalog declares, by name. It
 * drives the parity test (schema ↔ implementation) and the runtime catalog. Adding a
 * component means adding its Api here and its implementation in `catalog.ts`; the
 * `design-catalog-component` / `build-catalog-component` skills walk through both.
 */
import {TextApi} from './components/text/index.js';

export const COMPONENTS = {
  Text: TextApi,
} as const;

export const FUNCTIONS = {} as const;
