/**
 * Browser-safe versions of Node.js modules
 *
 * This provides browser-compatible implementations of server-only modules.
 * Import this before any other imports to ensure mocks are available.
 */

// Mock pg-promise for browser environment
const mockPgPromise = () => {
  console.warn('pg-promise is not available in browser environment');
  return {
    // Mock necessary methods with empty implementations
    none: () => Promise.resolve(),
    one: () => Promise.resolve({}),
    oneOrNone: () => Promise.resolve(null),
    many: () => Promise.resolve([]),
    manyOrNone: () => Promise.resolve([]),
    task: cb => Promise.resolve(cb(mockPgPromise())),
  };
};

// Export the mock as default export
export default mockPgPromise;

// Export named exports as well
export const pgp = mockPgPromise;

// Mock for client
export const client = {
  get: mockPgPromise(),
  query: () => Promise.resolve({ rows: [] }),
  connect: () => Promise.resolve(),
  end: () => Promise.resolve(),
};

// Apply mocks to global scope
if (typeof window !== 'undefined') {
  // @ts-ignore - Extending window
  window.__pgPromiseMock = mockPgPromise;
}

console.log('Loaded browser-safe module mocks');
