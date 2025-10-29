/**
 * Environment Detection Service
 *
 * This service helps detect whether code is running in a browser or server environment
 * and provides utilities for safely handling code that may run in either context.
 */

/**
 * Check if the current code is running in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && !(window as any).isNodeJS;
};

/**
 * Check if the current code is running in a server/Node.js environment
 */
export const isServer = (): boolean => {
  return typeof window === 'undefined' || (window as any).isNodeJS;
};

/**
 * Safely execute browser-only code
 * @param callback Function to execute in browser environments
 * @param fallback Optional fallback for server environments
 */
export const inBrowser = <T>(callback: () => T, fallback?: () => T): T | undefined => {
  if (isBrowser()) {
    return callback();
  }
  return fallback ? fallback() : undefined;
};

/**
 * Safely execute server-only code
 * @param callback Function to execute in server environments
 * @param fallback Optional fallback for browser environments
 */
export const inServer = <T>(callback: () => T, fallback?: () => T): T | undefined => {
  if (isServer()) {
    return callback();
  }
  return fallback ? fallback() : undefined;
};

/**
 * Create a mock promise that resolves with mock data when in browser
 * @param mockData The data to return in browser environments
 */
export const mockPromise = <T>(mockData: T): Promise<T> => {
  return new Promise(resolve => {
    // Add a small delay to simulate network request
    setTimeout(() => resolve(mockData), 100);
  });
};
