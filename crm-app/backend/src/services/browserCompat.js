/**
 * Browser Compatibility Module
 *
 * This module provides minimal compatibility for running in browser environments.
 * It does NOT create mocks for server-only features.
 *
 * Use this only for basic environment compatibility, NOT for mocking server features.
 */

// Define process if it doesn't exist
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      NODE_ENV: import.meta.env.MODE || 'development',
      ...import.meta.env,
    },
    browser: true,
    nextTick: fn => setTimeout(fn, 0),
    // Basic version definition
    version: '',
    versions: { node: '0.0.0' },
    platform: 'browser',
  };

  console.log('[browserCompat] Created process shim');
}

// Make sure import.meta.env values are copied to process.env
if (typeof window !== 'undefined' && window.process && import.meta && import.meta.env) {
  // Add all Vite environment variables to process.env
  for (const key in import.meta.env) {
    window.process.env[key] = import.meta.env[key];
  }
  console.log('[browserCompat] Copied Vite env vars to process.env');
}

// Add polyfill for dotenv.config() to prevent errors in browser
window.dotenvConfigCalled = false;
if (typeof window !== 'undefined') {
  // Prevent errors from calling dotenv.config()
  window._dotenvConfig = function () {
    if (!window.dotenvConfigCalled) {
      console.warn(
        'Browser compatibility: dotenv.config() was called in browser context (harmless)'
      );
      window.dotenvConfigCalled = true;
    }
    return { parsed: {} };
  };
}

// Define global if it doesn't exist
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
  console.log('Browser compatibility: Set window as global');
}

// Handle module loading errors
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    event => {
      // Handle module loading errors
      if (
        event.message?.includes('process is not defined') ||
        event.message?.includes('pg-promise') ||
        event.message?.includes('has been externalized for browser compatibility') ||
        event.message?.includes('Cannot access ".config" in client code') ||
        (event.filename &&
          (event.filename.includes('pg-promise') ||
            event.filename.includes('/pg/') ||
            event.filename.includes('bcryptjs') ||
            event.filename.includes('jsonwebtoken') ||
            event.filename.includes('dotenv')))
      ) {
        console.warn('[browserCompat] Prevented module error:', event.message);
        event.preventDefault();
        return false;
      }
    },
    true
  );

  // Also add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', event => {
    if (
      event.reason &&
      typeof event.reason.message === 'string' &&
      (event.reason.message.includes('externalized for browser compatibility') ||
        event.reason.message.includes('pg-promise') ||
        event.reason.message.includes('dotenv'))
    ) {
      console.warn('[browserCompat] Prevented unhandled rejection:', event.reason.message);
      event.preventDefault();
      return false;
    }
  });
}

// Export a function to verify the shims are working
export function verifyShims() {
  return {
    hasProcess: typeof process !== 'undefined',
    hasGlobal: typeof global !== 'undefined',
    nodeEnv: process?.env?.NODE_ENV || 'unknown',
  };
}
