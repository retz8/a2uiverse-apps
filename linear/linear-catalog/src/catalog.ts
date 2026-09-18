import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog, type ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';
import {PriorityIcon} from './components/priority-icon/index.js';
import {StatusIcon} from './components/status-icon/index.js';

/**
 * Linear's runtime catalog: the basic catalog's implementations and functions re-used as-is,
 * with two product components appended — `StatusIcon` and `PriorityIcon`, the two marks every
 * row of Linear's issue list carries, drawn by data, which no basic component can vary per row
 * (SPEC §9.2). Everything else of the product's identity is the Provider's token theme and
 * scoped sheet.
 */
export const CATALOG = new Catalog<ReactComponentImplementation>(
  CATALOG_ID,
  [...basicCatalog.components.values(), StatusIcon, PriorityIcon],
  [...basicCatalog.functions.values()],
);

/** The components this catalog appends to the basic catalog. */
export const PRODUCT_COMPONENTS = ['StatusIcon', 'PriorityIcon'] as const;
