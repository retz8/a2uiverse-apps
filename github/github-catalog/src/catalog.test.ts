import {describe, it, expect} from 'vitest';
import {CATALOG, CATALOG_ID} from './index';
import {COMPONENTS, FUNCTIONS} from './catalog.registry';

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

  it('exposes a function invoker', () => {
    expect(typeof CATALOG.invoker).toBe('function');
  });
});
