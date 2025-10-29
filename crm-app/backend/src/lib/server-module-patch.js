/**
 * server-module-patch.js
 *
 * Patch script to fix server modules in client-side code
 */

// Create an in-memory patch for pg-promise
export const patchModules = {
  'pg-promise': `
    // Browser-compatible replacement for pg-promise
    export default function pgPromise() {
      console.warn("pg-promise is not available in browser environment");
      
      // Return mock object with common methods
      return {
        // Connection methods
        connect: () => Promise.resolve({}),
        disconnect: () => undefined,
        
        // Query methods
        query: () => Promise.resolve({ rows: [] }),
        none: () => Promise.resolve(),
        one: () => Promise.resolve({}),
        oneOrNone: () => Promise.resolve(null),
        many: () => Promise.resolve([]),
        manyOrNone: () => Promise.resolve([]),
        any: () => Promise.resolve([]),
        
        // Transaction methods
        tx: (cb) => Promise.resolve(cb()),
        task: (cb) => Promise.resolve(cb())
      };
    };
  `,
};

// Exposed for direct use
export default patchModules;
