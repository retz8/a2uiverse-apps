import {Catalog} from '@a2ui/web_core/v0_9';
import type {ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';
import {TextComponent} from './components/text/index.js';

/**
 * __DISPLAY_NAME__'s runtime catalog: one implementation per registry entry. The seed
 * `Text` shows the shape; each component the catalog grows is imported here and registered
 * in `catalog.registry.ts`.
 */
export const CATALOG = new Catalog<ReactComponentImplementation>(CATALOG_ID, [TextComponent], []);
