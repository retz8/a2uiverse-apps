import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog, type ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';

/**
 * Calendar's runtime catalog: the basic catalog's implementations and functions re-used
 * as-is. The bundle contributes no component mapping of its own — its product identity
 * is the Provider's token theme, not a component library.
 */
export const CATALOG = new Catalog<ReactComponentImplementation>(
  CATALOG_ID,
  [...basicCatalog.components.values()],
  [...basicCatalog.functions.values()],
);
