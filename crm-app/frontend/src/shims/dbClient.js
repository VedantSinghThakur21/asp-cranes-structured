/**
 * Browser-compatible Database Client
 * This is a shim for use in browser environments
 *
 * IMPORTANT: This file is automatically aliased in vite.config.ts
 * when the app runs in a browser context.
 */

// Simple mock of dotenv to prevent errors
const dotenv = {
  config: () => ({ parsed: {} }),
};

// Return a mock database client for the browser
const createMockDb = () => {
  return {
    query: () => Promise.resolve({ rows: [] }),
    none: () => Promise.resolve(),
    one: () => Promise.resolve({}),
    oneOrNone: () => Promise.resolve(null),
    many: () => Promise.resolve([]),
    manyOrNone: () => Promise.resolve([]),
    any: () => Promise.resolve([]),
    connect: () =>
      Promise.resolve({
        done: () => {},
      }),
    task: callback =>
      Promise.resolve(
        callback({
          query: () => Promise.resolve({ rows: [] }),
          none: () => Promise.resolve(),
          one: () => Promise.resolve({}),
          oneOrNone: () => Promise.resolve(null),
          many: () => Promise.resolve([]),
          manyOrNone: () => Promise.resolve([]),
          any: () => Promise.resolve([]),
        })
      ),
  };
};

// Create mock database instance
const db = createMockDb();

// Mock pgp instance
const pgp = {
  as: {
    format: (text, values) => text,
  },
  helpers: {
    concat: objects => '',
    insert: (data, cols) => ({ text: '', values: [] }),
    update: (data, cols) => ({ text: '', values: [] }),
  },
};

console.warn(
  'Using browser mock for database client. API calls will be used instead of direct DB access.'
);

// Export the mock database instance and pgp
export { db, pgp };
