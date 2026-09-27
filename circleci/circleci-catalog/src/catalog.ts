import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog, type ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';
import {COMPONENTS} from './components/index.js';

/**
 * CircleCI's runtime catalog: its own components, and the A2UI basic catalog's functions —
 * formatting, validation, logic — which belong to the protocol's runtime, not to a look.
 */
export const CATALOG = new Catalog<ReactComponentImplementation>(CATALOG_ID, COMPONENTS, [
  ...basicCatalog.functions.values(),
]);
