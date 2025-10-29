// Development login utility
export const devLogin = {
  enabled: true,
  username: 'admin',
  password: 'admin123',

  // Auto-login for development
  autoLogin: async () => {
    try {
      // This is a development-only feature
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          token: 'dev-token-123',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
          },
        };
      }
      return { success: false };
    } catch (error) {
      console.error('Development login error:', error);
      return { success: false };
    }
  },
};

/**
 * Create a development token for testing
 */
export function createDevToken(): string {
  return `dev-token-${Date.now()}`;
}

export default devLogin;
