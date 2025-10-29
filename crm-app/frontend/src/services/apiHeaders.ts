/**
 * API Headers Utility
 *
 * Shared utility for creating API request headers with authentication tokens
 * Production-ready implementation for secure private cloud deployment
 */

import { isDev, logDebug, logError } from './envConfig';

/**
 * Get auth headers for API requests
 * Sets up Content-Type and Authorization with JWT token
 */
export const getHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    'X-Application-Type': 'asp-cranes-crm',
  };

  // Add JWT token if available
  const token = localStorage.getItem('jwt-token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Log header usage in development only
  if (isDev()) {
    const hasToken = !!headers['Authorization'];
    logDebug(`API headers prepared: Auth token ${hasToken ? 'present' : 'missing'}`);
  }

  return headers;
};

/**
 * Headers for sensitive data operations
 * Includes stronger protection measures for sensitive operations
 */
export const getSensitiveOperationHeaders = (): HeadersInit => {
  const headers = { ...(getHeaders() as Record<string, string>) };

  // Add timestamp to prevent replay attacks
  headers['X-Request-Timestamp'] = Date.now().toString();

  // Add a request ID for better traceability
  headers['X-Request-ID'] = generateRequestId();

  return headers;
};

/**
 * Headers for file upload operations
 */
export const getFileUploadHeaders = (): HeadersInit => {
  // Don't include Content-Type as it will be set by the browser
  // with the correct multipart boundary
  const uploadHeaders: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Application-Type': 'asp-cranes-crm',
  };

  // Add JWT token if available
  const token = localStorage.getItem('jwt-token');
  if (token) {
    uploadHeaders['Authorization'] = `Bearer ${token}`;
  }

  return uploadHeaders;
};

/**
 * Generate a unique request ID for tracing
 */
const generateRequestId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

/**
 * Check if current token appears to be valid
 * Used for client-side token validation
 */
export const hasValidToken = (): boolean => {
  try {
    const token = localStorage.getItem('jwt-token');
    if (!token) return false;

    // Basic token format validation
    const parts = token.split('.');
    return parts.length === 3; // JWT has 3 parts
  } catch (e) {
    logError('Error checking token validity:', e);
    return false;
  }
};
