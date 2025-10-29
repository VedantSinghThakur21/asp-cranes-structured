/**
 * Enhanced Auth Store with Silent Token Refresh
 * Implements automatic token refresh, secure storage, and improved error handling
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '../types/auth';
// Note: tokenManager will be used for automatic refresh functionality

interface AuthStore extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setUser: (user: AuthState['user']) => void;
  clearUser: () => void;
  isTokenValid: () => boolean;
  scheduleTokenRefresh: () => void;
}

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Token refresh interval (13 minutes for 15-minute tokens)
const REFRESH_INTERVAL = 13 * 60 * 1000;
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * API call with automatic token refresh
 */
const apiCallWithRefresh = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const store = useAuthStore.getState();

  // Add auth header if token exists
  if (store.token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${store.token}`,
      'Content-Type': 'application/json',
    };
  }

  let response = await fetch(url, options);

  // If token expired, try to refresh and retry
  if (response.status === 401 && store.token) {
    console.log('🔄 Token expired, attempting refresh...');

    const refreshSuccessful = await store.refreshToken();

    if (refreshSuccessful) {
      // Retry original request with new token
      const newToken = useAuthStore.getState().token;
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      };
      response = await fetch(url, options);
    }
  }

  return response;
};

/**
 * Enhanced Auth Store with Automatic Token Refresh
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,

      /**
       * Enhanced Login with Remember Me
       */
      login: async (email: string, password: string, remember: boolean = false) => {
        try {
          set({ error: null });

          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies for refresh token
            body: JSON.stringify({ email, password, remember }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const data = await response.json();

          // Validate response structure
          if (!data.accessToken || !data.user) {
            throw new Error('Invalid login response format');
          }

          // Update state
          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
            error: null,
          });

          // Schedule automatic token refresh
          get().scheduleTokenRefresh();

          console.log('✅ Login successful:', data.user.name);
        } catch (error) {
          const errorMessage = (error as Error).message;
          set({
            error: errorMessage,
            user: null,
            token: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      /**
       * Silent Token Refresh
       */
      refreshToken: async (): Promise<boolean> => {
        try {
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // Include refresh token cookie
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            console.log('❌ Token refresh failed, logging out...');
            get().clearUser();
            return false;
          }

          const data = await response.json();

          // Update token and user data
          set({
            token: data.accessToken,
            user: data.user,
            isAuthenticated: true,
            error: null,
          });

          // Schedule next refresh
          get().scheduleTokenRefresh();

          console.log('🔄 Token refreshed successfully');
          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          get().clearUser();
          return false;
        }
      },

      /**
       * Enhanced Logout
       */
      logout: async () => {
        try {
          // Clear refresh timer
          if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
          }

          // Call logout endpoint to clear server-side refresh token
          const token = get().token;
          if (token) {
            await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Always clear local state
          get().clearUser();
        }
      },

      /**
       * Check if current token is valid (not expired)
       */
      isTokenValid: (): boolean => {
        const { token } = get();
        if (!token) return false;

        try {
          // Decode JWT payload (without verification - just to check expiry)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          // Check if token expires in the next 2 minutes
          return payload.exp > currentTime + 120;
        } catch {
          return false;
        }
      },

      /**
       * Schedule automatic token refresh
       */
      scheduleTokenRefresh: () => {
        // Clear existing timer
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        // Set new refresh timer
        refreshTimer = setTimeout(() => {
          const { isAuthenticated, isTokenValid } = get();

          if (isAuthenticated && !isTokenValid()) {
            console.log('🔄 Scheduled token refresh triggered');
            get().refreshToken();
          }
        }, REFRESH_INTERVAL);
      },

      /**
       * Set user data
       */
      setUser: user => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      /**
       * Clear all user data and tokens
       */
      clearUser: () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: 'asp-cranes-auth',
      // Only persist user data, not sensitive tokens
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Auth Store Hydration with Token Validation
 */
export const hydrateAuthStore = async (): Promise<void> => {
  try {
    console.log('🔄 Hydrating auth store...');

    // Try to refresh token on app start
    const refreshSuccessful = await useAuthStore.getState().refreshToken();

    if (refreshSuccessful) {
      console.log('✅ Auth store hydrated successfully');
    } else {
      console.log('❌ Auth hydration failed, user needs to login');
      useAuthStore.getState().clearUser();
    }
  } catch (error) {
    console.error('Auth hydration error:', error);
    useAuthStore.getState().clearUser();
  }
};

/**
 * Enhanced API Service with Auto-Refresh
 */
export const authApiService = {
  async get(endpoint: string) {
    const response = await apiCallWithRefresh(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await apiCallWithRefresh(`${API_BASE}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  async put(endpoint: string, data: any) {
    const response = await apiCallWithRefresh(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await apiCallWithRefresh(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },
};

// Auto-start token refresh on store initialization
if (typeof window !== 'undefined') {
  // Schedule refresh if user is already authenticated
  const state = useAuthStore.getState();
  if (state.isAuthenticated && state.token) {
    state.scheduleTokenRefresh();
  }
}
