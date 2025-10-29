/**
 * Server Module Exclusion Plugin for Vite
 *
 * This plugin replaces server-side modules with browser-compatible versions
 * and prevents imports of Node.js specific modules in the client code.
 */

// Regex to identify server-only modules from node_modules
const nodeModulesRegex =
  /node_modules\/(pg-promise|pg|bcryptjs|jsonwebtoken|dotenv|express|cors|body-parser|fs|path|crypto|os)/;

export default function noServerModules() {
  return {
    name: 'no-server-modules',

    resolveId(id) {
      // Skip our own shim files - they're already properly configured
      if (id.includes('/shims/')) {
        return null;
      }

      // Map specific modules to their browser-compatible versions
      const moduleMap = {
        'pg-promise': '/src/shims/pg-promise.js',
        'dotenv': '/src/shims/dotenv.js',
        './lib/dbClient.js': '/src/shims/dbClient.js',
        '../lib/dbClient.js': '/src/shims/dbClient.js',
        '../../lib/dbClient.js': '/src/shims/dbClient.js',
      };

      if (moduleMap[id]) {
        console.log(`[noServerModules] Mapping ${id} to ${moduleMap[id]}`);
        return { id: moduleMap[id], external: false };
      }

      return null;
    },

    load(id) {
      // Replace server-only node_modules with empty exports
      if (nodeModulesRegex.test(id)) {
        console.log(`[noServerModules] Replacing server module: ${id}`);
        return 'export default {}; export function config() { return { parsed: {} }; }';
      }

      return null;
    },
  };
}
