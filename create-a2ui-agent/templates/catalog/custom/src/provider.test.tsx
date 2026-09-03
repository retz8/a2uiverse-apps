import {render} from '@testing-library/react';
import {expect, test} from 'vitest';
import {Provider} from './provider';

test('mounts a scope element around its children', () => {
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  const scope = container.querySelector('.__PACKAGE_NAME__-scope') as HTMLElement;
  expect(scope).not.toBeNull();
  expect(scope.querySelector('span')?.textContent).toBe('content');
});

test('anchors a portal root inside the scope element', () => {
  // Overlays must open inside the fragment boundary, never at the end of body.
  const {container} = render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  expect(container.querySelector('[data-portal-root]')).not.toBeNull();
});

test('writes nothing on the document root', () => {
  render(
    <Provider>
      <span>content</span>
    </Provider>,
  );
  expect(document.documentElement.getAttribute('style')).toBeNull();
});
