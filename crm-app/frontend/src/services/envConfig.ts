/**
 * Environment Configuration Utility
 *
 * This utility provides environment-specific configuration and behavior
 * for production-ready deployment with proper security controls.
 */

// Cache the environment result to avoid inconsistencies during runtime
let _isProdCache: boolean | null = null;

export const isProd = (): boolean => {
  // Return cached result if available to ensure consistency
  if (_isProdCache !== null) {
    return _isProdCache;
  }

  // Multiple checks to ensure we detect production correctly
  const checks = {
    // Check 1: Vite mode indicator
    viteModeCheck: (import.meta as any).env.MODE === 'production',

    // Check 2: Vite dev flag (inverse)
    viteDevCheck: (import.meta as any).env.DEV === false,

    // Check 3: Vite PROD flag (direct)
    viteProdCheck: (import.meta as any).env.PROD === true,

    // Check 4: URL hostname check (only if in browser)
    urlCheck:
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('.local'),
  };

  // Log the results in development mode for debugging
  if ((import.meta as any).env.DEV) {
    console.log('Environment detection results:', checks);
  }

  // STRICT PRODUCTION DETECTION:
  const isProdBuild = checks.viteProdCheck && checks.viteDevCheck;

  // Cache the result
  _isProdCache = isProdBuild;
  return isProdBuild;
};

export const isDev = (): boolean => {
  // If it's not production, treat as development
  return !isProd();
};

/**
 * API configuration
 */
export const getApiBaseUrl = (): string => {
  // Check the current environment
  if (typeof window === 'undefined') {
    // Server-side environment
    return '/api';
  }

  // Client-side environment
  return (import.meta as any).env.VITE_API_URL || '/api';
};

/**
 * Production-only code guard
 * @param fn Function to execute only in production
 */
export const runInProdOnly = (fn: () => void): void => {
  if (isProd()) {
    fn();
  }
};

/**
 * Development-only code guard
 * @param fn Function to execute only in development
 */
export const runInDevOnly = (fn: () => void): void => {
  if (isDev()) {
    fn();
  }
};

/**
 * Log messages appropriate for the current environment
 */
export const logDebug = (message: string, ...args: any[]): void => {
  if (isDev()) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

export const logWarning = (message: string, ...args: any[]): void => {
  console.warn(`[WARNING] ${message}`, ...args);
};

export const logError = (message: string, ...args: any[]): void => {
  console.error(`[ERROR] ${message}`, ...args);
};

/**
 * Production deployment check
 * Helps identify if development features are accidentally included in production
 */
export const validateProductionDeploy = (): void => {
  if (isProd() && typeof window !== 'undefined') {
    // Production startup banner
    console.log(
      '%c🔒 PRODUCTION MODE ACTIVE',
      'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    );

    // Apply production-specific security measures
    try {
      if (typeof window !== 'undefined' && isProd()) {
        const originalConsoleLog = console.log;
        console.log = function (...args: any[]) {
          // Only log errors and warnings in production, filter out debug logs
          if (
            args[0] &&
            typeof args[0] === 'string' &&
            (args[0].includes('[ERROR]') || args[0].includes('[WARNING]'))
          ) {
            originalConsoleLog.apply(console, args);
          }
        };
      }
    } catch (e) {
      // Ignore console patching errors
    }
  }
};

// Run validation on module import in production
runInProdOnly(() => {
  validateProductionDeploy();
});
