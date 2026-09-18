import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog, type ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';
import {StatusBadge} from './components/status-badge/index.js';

/**
 * CircleCI's runtime catalog: the basic catalog's implementations and functions re-used as-is,
 * with one product component appended — `StatusBadge`, a status drawn in its own color, which
 * no basic component can vary per row (SPEC §9.2). Everything else of the product's identity is
 * the Provider's token theme and scoped sheet.
 */
export const CATALOG = new Catalog<ReactComponentImplementation>(
  CATALOG_ID,
  [...basicCatalog.components.values(), StatusBadge],
  [...basicCatalog.functions.values()],
);

/** The components this catalog appends to the basic catalog. */
export const PRODUCT_COMPONENTS = ['StatusBadge'] as const;
