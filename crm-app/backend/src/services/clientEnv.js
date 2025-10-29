/**
 * Client-side Environment Variables
 *
 * This module provides environment variables for the browser
 * without relying on dotenv or Node.js process.env
 */

// Get environment variables from import.meta.env (Vite feature)
// or from a fallback object with default values
const clientEnv = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};

// Default values for client-side environment variables
const defaults = {
  VITE_API_URL: 'http://localhost:3001/api',
  VITE_DB_HOST: 'localhost',
  VITE_DB_PORT: '5432',
  VITE_DB_NAME: 'asp_crm',
  VITE_DB_USER: 'postgres',
  // No default password for security reasons
};

// Create a browser-safe process.env replacement
export const env = new Proxy(
  {},
  {
    get: (target, prop) => {
      // Try to get from import.meta.env first
      if (clientEnv[prop] !== undefined) {
        return clientEnv[prop];
      }

      // Fall back to defaults
      if (defaults[prop] !== undefined) {
        return defaults[prop];
      }

      // For VITE_ prefixed variables, try without prefix
      if (typeof prop === 'string' && prop.startsWith('VITE_')) {
        const unprefixed = prop.substring(5);
        if (clientEnv[unprefixed] !== undefined) {
          return clientEnv[unprefixed];
        }
        if (defaults[unprefixed] !== undefined) {
          return defaults[unprefixed];
        }
      }

      // Return undefined for anything else
      return undefined;
    },
  }
);

// Mock config function that does nothing in the browser
export const config = () => {
  // No-op for browser compatibility
  console.warn('dotenv.config() is not available in browser environment');
  return { parsed: {} };
};

// Default export to match dotenv API
export default {
  config,
  parse: () => ({}),
};
