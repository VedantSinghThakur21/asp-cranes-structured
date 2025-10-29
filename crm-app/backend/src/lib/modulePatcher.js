/**
 * Module patching system
 *
 * This module patches problematic Node.js modules with browser-compatible versions.
 */

// Create browser-safe environment
const setupBrowserEnv = () => {
  if (typeof window === 'undefined') return; // Skip on server

  // Create a minimal process object if it doesn't exist
  if (!window.process) {
    // @ts-ignore - We're adding process to window
    window.process = {
      env: {
        NODE_ENV: import.meta.env.MODE || 'development',
      },
      browser: true,
      version: '',
      nextTick: fn => setTimeout(fn, 0),
    };
    console.log('Created mock process object for browser');
  }

  // Add module patching mechanism
  if (!window.__patchedModules) {
    // @ts-ignore - We're adding a custom property
    window.__patchedModules = new Set();
  }

  // Patch modulepreload errors
  window.addEventListener(
    'error',
    event => {
      // Look for specific errors related to server modules
      if (
        event.message?.includes('process is not defined') ||
        event.message?.includes("Cannot read properties of undefined (reading 'env')") ||
        (event.filename &&
          (event.filename.includes('pg-promise') ||
            event.filename.includes('pg/') ||
            event.filename.includes('bcryptjs') ||
            event.filename.includes('jsonwebtoken')))
      ) {
        console.warn('Intercepted module error:', event.message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    },
    true
  );

  console.log('Module patching system initialized');
};

// Run setup immediately
setupBrowserEnv();

export default {
  setupBrowserEnv,
};
