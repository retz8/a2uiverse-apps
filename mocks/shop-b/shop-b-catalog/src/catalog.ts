import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ReactCatalogComponent} from '@a2ui/react/v0_9';
import {CATALOG_ID, CATALOG_PROTOCOL_VERSION} from './catalog-id.js';

/**
 * Shop B's runtime catalog: the basic catalog's components and functions as
 * `@a2ui/web_core` ships them, re-used as-is. The bundle contributes no component mapping of its own — its product
 * identity is the Provider's token theme, not a component library.
 */
export const CATALOG = new Catalog<ReactCatalogComponent>(
  CATALOG_ID,
  CATALOG_PROTOCOL_VERSION,
  [...basicCatalog.components.values()],
  [...basicCatalog.functions.values()],
);
