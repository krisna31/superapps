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

// Fallback test master password hash for 'superapps-private-vault'
if (!import.meta.env.VITE_MASTER_PASSWORD_HASH) {
  import.meta.env.VITE_MASTER_PASSWORD_HASH = 'b9efee894674820babc6d17aab0c9bc9336317eda9d6fdac7fbc9304c7373894';
}
