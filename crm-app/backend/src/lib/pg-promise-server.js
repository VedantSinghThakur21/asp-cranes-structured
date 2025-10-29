/**
 * pg-promise import bridge for server
 *
 * This file provides a proper import for pg-promise in the server environment.
 * It handles the case when pg-promise is in devDependencies rather than dependencies.
 * Uses a try-catch to provide better error messaging.
 */

let pgPromiseRaw;

try {
  // Dynamic import to handle ESM compatibility issues
  pgPromiseRaw = (await import('pg-promise')).default;
} catch (err) {
  console.error('Failed to import pg-promise:', err.message);
  console.error('Make sure pg-promise is installed with: npm install pg-promise --save-dev');

  // Provide a fallback implementation to prevent crashes
  pgPromiseRaw = () => {
    throw new Error(
      'pg-promise is not installed or could not be imported. Run npm install pg-promise --save-dev'
    );
  };
}

// Export the properly configured pg-promise
export default pgPromiseRaw;
