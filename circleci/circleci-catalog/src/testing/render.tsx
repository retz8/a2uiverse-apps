/**
 * Renders an A2UI tree through the real renderer — `MessageProcessor` → `A2uiSurface` — under the
 * Provider, so a test exercises the binder, the schemas and the templates, not a view alone.
 */
import {render, type RenderResult} from '@testing-library/react';
import {A2uiSurface, type ReactComponentImplementation} from '@a2ui/react/v0_9';
import {MessageProcessor, type A2uiClientAction} from '@a2ui/web_core/v0_9';
import {CATALOG} from '../catalog.js';
import {CATALOG_ID} from '../catalog-id.js';
import {Provider} from '../provider.js';

export type TreeComponent = {id: string; component: string} & Record<string, unknown>;

export const SURFACE_ID = 'test';

export function renderTree(
  components: TreeComponent[],
  options: {data?: Record<string, unknown>; onAction?: (action: A2uiClientAction) => void} = {},
): RenderResult {
  const processor = new MessageProcessor<ReactComponentImplementation>([CATALOG], options.onAction);
  processor.processMessages([
    {version: 'v0.9', createSurface: {surfaceId: SURFACE_ID, catalogId: CATALOG_ID}},
    ...(options.data
      ? [
          {
            version: 'v0.9',
            updateDataModel: {surfaceId: SURFACE_ID, path: '/', value: options.data},
          },
        ]
      : []),
    {version: 'v0.9', updateComponents: {surfaceId: SURFACE_ID, components}},
  ] as never);
  const surface = processor.model.surfacesMap.get(SURFACE_ID);
  if (!surface) throw new Error('surface was not created');
  return render(
    <Provider>
      <A2uiSurface surface={surface} />
    </Provider>,
  );
}
