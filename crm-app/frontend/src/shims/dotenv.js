/**
 * Browser-compatible dotenv shim
 *
 * This provides a compatible API with dotenv in the browser.
 * It exports a config function that returns an empty parsed object
 * to prevent runtime errors when code tries to use dotenv.config().
 */
import { config as clientConfig } from '../lib/clientEnv.js';

// Create a compatible config function that won't break when called
const config = () => {
  console.log('[dotenv.shim] Using browser-compatible dotenv.config()');
  return { parsed: {} };
};

// Export the default object with config method
export default {
  config,
  parse: () => ({}),
};

// Also named export for ESM imports
export { config };
