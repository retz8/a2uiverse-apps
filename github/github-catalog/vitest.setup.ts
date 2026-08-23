import '@testing-library/jest-dom/vitest';

// jsdom does not implement IntersectionObserver. Primer's ActionBar items (IconButton, Divider,
// Group, Menu) subscribe one through `useActionBarItem` to measure overflow, so rendering any of
// them under vitest throws "IntersectionObserver is not defined". Provide a no-op stub: nothing is
// ever reported as intersecting/overflowing, so items render inline (overflow measurement is a
// browser-only concern covered by the Playwright baseline, not the jsdom render tests).
if (typeof globalThis !== 'undefined' && typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

// jsdom has no matchMedia; some Primer components (e.g. ToggleSwitch's loading spinner) call it
// through useMedia. Provide a no-match stub so those components render under vitest.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom has no ResizeObserver; Primer's `useOverflow` (used by PageLayout.Pane / .Sidebar to detect
// scroll overflow) constructs one in a passive effect and throws without it. Provide a no-op stub so
// those regions render under vitest (the overflow branch simply never fires — no element overflows).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Primer's TooltipV2 (used by IconButton, e.g. inside TextInput.Action) loads the
// `@oddbird/popover-polyfill` under jsdom, whose `injectStyles` spreads
// `root.adoptedStyleSheets`. jsdom does not implement `adoptedStyleSheets`, so the spread
// throws "not iterable" in a passive effect. Provide a writable, per-node array so the
// polyfill's read-then-assign works and the tooltip renders under vitest.
if (typeof document !== 'undefined' && !('adoptedStyleSheets' in Document.prototype)) {
  const store = new WeakMap<object, unknown[]>();
  const protos: Array<object | undefined> = [
    Document.prototype,
    typeof ShadowRoot !== 'undefined' ? ShadowRoot.prototype : undefined,
  ];
  for (const proto of protos) {
    if (!proto) continue;
    Object.defineProperty(proto, 'adoptedStyleSheets', {
      configurable: true,
      get() {
        let sheets = store.get(this as object);
        if (!sheets) {
          sheets = [];
          store.set(this as object, sheets);
        }
        return sheets;
      },
      set(value: unknown[]) {
        store.set(this as object, value);
      },
    });
  }
}

// jsdom has no ResizeObserver; Primer's ConfirmationDialog (wrapped by TreeView.ErrorDialog)
// calls it through useOverflow to detect a scrollable body. Provide a no-op stub so the dialog
// mounts under vitest.
if (typeof globalThis !== 'undefined' && typeof globalThis.ResizeObserver !== 'function') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom does not implement element scrolling. Primer's FilteredActionList (used by SelectPanel)
// calls `scrollIntoView` on the active descendant, which reaches `Element.scrollTo`, and Primer
// scrolls its list container via `scrollIntoView`. Both throw "not a function" in a passive effect
// under jsdom. Provide no-op stubs so the panel mounts (scroll positioning is a browser-only
// concern covered by the Playwright baseline, not the jsdom render tests).
if (typeof Element !== 'undefined') {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = () => {};
  }
  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => {};
  }
}

// Primer announces screen-reader text (e.g. ToggleSwitch's loadingLabel, Button's
// loadingAnnouncement) through a `<live-region>` custom element. Its node build fails to
// upgrade under jsdom, so `announceFromElement` throws in a MutationObserver microtask.
// Pre-register a no-op element: Primer sees one already defined and skips its own, and the
// announcement becomes a harmless no-op (the AT text itself is asserted structurally).
if (typeof customElements !== 'undefined' && !customElements.get('live-region')) {
  class LiveRegionStub extends HTMLElement {
    announce() {
      return {cancel() {}};
    }
    announceFromElement() {
      return {cancel() {}};
    }
    getMessage() {
      return '';
    }
    clear() {}
  }
  customElements.define('live-region', LiveRegionStub);
}
