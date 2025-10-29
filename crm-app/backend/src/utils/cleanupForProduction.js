/**
 * Production Build Script - Token Cleanup
 * This script should run before the production build to ensure no dev tokens are present
 */

// Check for dev tokens in localStorage
const localStorageKeys = Object.keys(localStorage);
const devTokenKeys = localStorageKeys.filter(key => {
  // Check for any keys that might contain development tokens
  const value = localStorage.getItem(key);
  if (!value) return false;

  // Specific checks for dev token indicators
  const isDevToken =
    key.includes('dev') ||
    key.includes('test') ||
    key.includes('mock') ||
    key.includes('bypass') ||
    (key === 'jwt-token' &&
      (value.includes('dev-user') ||
        value.includes('development') ||
        value.includes('dev-signature')));

  return isDevToken;
});

// If any dev tokens found, warn and clean up
if (devTokenKeys.length > 0) {
  console.warn('⚠️ PRODUCTION BUILD PREPARATION');
  console.warn('Development tokens found in localStorage that need to be cleared:');
  console.table(devTokenKeys);

  // Remove all dev tokens
  devTokenKeys.forEach(key => {
    console.log(`Removing dev token key: ${key}`);
    localStorage.removeItem(key);
  });

  console.log('✅ Dev tokens cleared from localStorage');
} else {
  console.log('✅ No development tokens found in localStorage');
}

// Check for dev token in sessionStorage as well
const sessionStorageKeys = Object.keys(sessionStorage);
const devSessionTokens = sessionStorageKeys.filter(key => {
  const value = sessionStorage.getItem(key);
  if (!value) return false;

  return (
    key.includes('dev') ||
    key.includes('test') ||
    key.includes('mock') ||
    key.includes('bypass') ||
    value.includes('dev-user') ||
    value.includes('development') ||
    value.includes('dev-signature')
  );
});

// Clean up session storage as well
if (devSessionTokens.length > 0) {
  console.warn('Development tokens found in sessionStorage:');
  console.table(devSessionTokens);

  devSessionTokens.forEach(key => {
    console.log(`Removing dev token key from sessionStorage: ${key}`);
    sessionStorage.removeItem(key);
  });

  console.log('✅ Dev tokens cleared from sessionStorage');
}

// Set a production marker in localStorage
localStorage.setItem('env-deploy-type', 'production');
console.log('🔒 Production environment marker set');

console.log('✅ Token cleanup completed. Ready for production build.');
