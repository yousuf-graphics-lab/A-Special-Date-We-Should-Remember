import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

export const APP_ORIGIN = process.env.TEST_APP_ORIGIN ?? 'http://localhost:3000';

// jsdom has no layout engine and no matchMedia — both are used by framer-motion.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// framer-motion's whileInView needs an IntersectionObserver; jsdom has none.
if (!('IntersectionObserver' in globalThis)) {
  class StubIntersectionObserver {
    private callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.callback(
        [{ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // @ts-expect-error test stub
  globalThis.IntersectionObserver = StubIntersectionObserver;
}

if (!window.scrollTo) {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}
Element.prototype.scrollIntoView = () => {};

// Relative fetches are resolved against the running app server.
const realFetch = globalThis.fetch;
vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.startsWith('/')) {
    return realFetch(`${APP_ORIGIN}${input}`, init);
  }
  return realFetch(input as RequestInfo, init);
});

// jsdom lacks these APIs; the components degrade gracefully when absent.
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:preview';
  globalThis.URL.revokeObjectURL = () => {};
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
