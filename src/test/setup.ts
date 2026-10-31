import '@testing-library/jest-dom';

// Mock window.matchMedia
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
    dispatchEvent: () => false,
  }),
});

// Mock crypto.randomUUID
if (!window.crypto.randomUUID) {
  window.crypto.randomUUID = () => '12345678-1234-4234-8234-123456789abc' as `${string}-${string}-${string}-${string}-${string}`;
}
