import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';

// Polyfill webcrypto in jsdom if missing
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

// Mock canvas-confetti in tests
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
