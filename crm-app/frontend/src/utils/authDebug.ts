// Authentication debugging utility
export const authDebug = {
  enabled: process.env.NODE_ENV === 'development',

  log: (message: string, data?: any) => {
    if (authDebug.enabled) {
      console.log(`[AUTH DEBUG] ${message}`, data);
    }
  },

  error: (message: string, error?: any) => {
    if (authDebug.enabled) {
      console.error(`[AUTH ERROR] ${message}`, error);
    }
  },

  // Debug token validation
  debugToken: (token: string) => {
    if (authDebug.enabled) {
      console.log('[AUTH DEBUG] Token:', token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[AUTH DEBUG] Token payload:', payload);
      } catch (e) {
        console.log('[AUTH DEBUG] Failed to parse token');
      }
    }
  },

  // Debug API calls
  debugApiCall: (method: string, url: string, data?: any) => {
    if (authDebug.enabled) {
      console.log(`[AUTH DEBUG] API Call: ${method} ${url}`, data);
    }
  },
};

export default authDebug;
