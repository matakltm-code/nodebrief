import '@testing-library/jest-dom/vitest';

// Mock DOMMatrixReadOnly for JSDOM
class MockDOMMatrixReadOnly {
  m22 = 1;
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  constructor() {}
}

class ResizeObserverMock {
  callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

  constructor(callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void) {
    this.callback = callback;
  }

  observe(target: Element) {
    const width = parseFloat((target as HTMLElement).style?.width) || 224;
    const height = parseFloat((target as HTMLElement).style?.height) || 180;
    const entry = {
      target,
      contentRect: {
        width,
        height,
        top: 0,
        left: 0,
        bottom: height,
        right: width,
        x: 0,
        y: 0,
        toJSON: () => {},
      },
      borderBoxSize: [{ inlineSize: width, blockSize: height }],
      contentBoxSize: [{ inlineSize: width, blockSize: height }],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry;

    this.callback([entry], this as unknown as ResizeObserver);
  }

  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined') {
  window.DOMMatrixReadOnly = MockDOMMatrixReadOnly as unknown as typeof DOMMatrixReadOnly;
  globalThis.DOMMatrixReadOnly = MockDOMMatrixReadOnly as unknown as typeof DOMMatrixReadOnly;
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: {
      get() {
        return parseFloat(this.style?.height) || 180;
      },
    },
    offsetWidth: {
      get() {
        return parseFloat(this.style?.width) || 224;
      },
    },
  });

  (SVGElement.prototype as unknown as Record<string, unknown>).getBBox = function (this: unknown) {
    const el = this as SVGElement;
    return {
      x: 0,
      y: 0,
      width: parseFloat(el.getAttribute?.('width') || '100') || 100,
      height: parseFloat(el.getAttribute?.('height') || '100') || 100,
      bottom: 100,
      left: 0,
      right: 100,
      top: 0,
      toJSON: () => {},
    };
  };

  HTMLElement.prototype.getBoundingClientRect = function () {
    const isHandle = this.classList.contains('react-flow__handle');
    const width = isHandle ? 14 : (parseFloat(this.style?.width) || 224);
    const height = isHandle ? 14 : (parseFloat(this.style?.height) || 180);
    return {
      width,
      height,
      top: 50,
      left: 50,
      bottom: 50 + height,
      right: 50 + width,
      x: 50,
      y: 50,
      toJSON: () => {},
    };
  };

  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        readText: async () => '',
        writeText: async () => {},
      },
      writable: true,
      configurable: true,
    });
  }
}
