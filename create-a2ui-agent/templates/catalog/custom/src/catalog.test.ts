import {describe, it, expect} from 'vitest';
import {CATALOG, CATALOG_ID} from './index.js';
import {COMPONENTS, FUNCTIONS} from './catalog.registry.js';

describe('CATALOG', () => {
  it('carries the catalog id', () => {
    expect(CATALOG.id).toBe(CATALOG_ID);
  });

  it('registers exactly the registry components', () => {
    expect([...CATALOG.components.keys()].sort()).toEqual(Object.keys(COMPONENTS).sort());
  });

  it('registers exactly the registry functions', () => {
    expect([...CATALOG.functions.keys()].sort()).toEqual(Object.keys(FUNCTIONS).sort());
  });
});
