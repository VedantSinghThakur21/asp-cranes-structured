/**
 * authStore.ts - Safe version
 * Uses PostgreSQL authentication instead of Firebase
 */
import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import { AuthState } from '../types/auth';
import { signIn, signOutUser, getCurrentUser } from '../services/authService';
import { saveAuthToStorage, clearAuthFromStorage } from '../utils/sessionStorage';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthState['user']) => void;
  clearUser: () => void;
}

// Track hydration to prevent loops
let hasHydrated = false;

// Create the store with proper typing - TEMPORARILY WITHOUT PERSIST
export const useAuthStore = create<AuthStore>()(
  // persist(
  set => ({
    user: null,
    token: null,
    isAuthenticated: false,
    error: null,

    login: async (email: string, password: string) => {
      try {
        set({ error: null });

        // Sign in with PostgreSQL authentication service
        const user = await signIn(email, password);
        console.log('🔐 Login successful - User data received:', JSON.stringify(user, null, 2));
        console.log('🏷️ User role check:', user?.role);

        // Validate and ensure user has proper role
        if (!user || !user.role) {
          console.error('❌ User object missing or role undefined:', user);
          throw new Error('Invalid user data - role missing');
        }

        if (
          !['admin', 'sales_agent', 'operations_manager', 'operator', 'support'].includes(user.role)
        ) {
          console.error('❌ Invalid user role:', user.role);
          throw new Error(`Invalid user role: ${user.role}`);
        }

        console.log('✅ User role validation passed:', user.role);

        // Get token from local storage (it's set by the signIn function)
        const token = localStorage.getItem('jwt-token') || '';

        // Update state after successful authentication
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });

        // Also save to localStorage for backup persistence
        saveAuthToStorage(user, token);

        // CRITICAL: Mark that user has authenticated explicitly
        localStorage.setItem('explicit-login-performed', 'true');

        // Add a timestamp for the last successful login
        localStorage.setItem('last-login-time', Date.now().toString());
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    logout: async () => {
      try {
        // Mark that we're actively logging out
        localStorage.setItem('logging-out', 'true');

        // Sign out using PostgreSQL auth service
        await signOutUser();

        // Clear all auth-related state and storage
        set({ user: null, token: null, isAuthenticated: false, error: null });
        clearAuthFromStorage();

        // Remove the explicit login flag
        localStorage.removeItem('explicit-login-performed');
        // Remove JWT token
        localStorage.removeItem('jwt-token');
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      } finally {
        // Always clear the logging out flag, even on error
        setTimeout(() => {
          localStorage.removeItem('logging-out');
        }, 1000);
      }
    },

    // Simple helpers for setting/clearing user
    setUser: user =>
      set({
        user,
        isAuthenticated: !!user,
        error: null,
      }),

    clearUser: () =>
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      }),
  })
  // Temporarily disabled persist
);

/**
 * Hydrate the auth store - Simplified implementation
 */
export const hydrateAuthStore = async () => {
  // Only rehydrate once to prevent infinite loops
  if (!hasHydrated) {
    try {
      console.log('🔄 Hydrating auth store...');

      // Check if we have a valid JWT token
      const token = localStorage.getItem('jwt-token');
      const explicitLogin = localStorage.getItem('explicit-login-performed');

      if (token && explicitLogin) {
        console.log('📦 Found stored auth token, verifying...');

        try {
          // Verify the token with the backend
          const currentUser = await getCurrentUser();
          if (currentUser) {
            console.log('✅ Token valid, restoring user session:', currentUser.name);
            useAuthStore.setState({
              user: currentUser,
              token,
              isAuthenticated: true,
              error: null,
            });
          } else {
            console.log('❌ Token invalid, clearing stored data');
            localStorage.removeItem('jwt-token');
            localStorage.removeItem('explicit-login-performed');
            useAuthStore.setState({
              user: null,
              token: null,
              isAuthenticated: false,
              error: null,
            });
          }
        } catch (error) {
          console.log('❌ Token verification failed, clearing stored data');
          localStorage.removeItem('jwt-token');
          localStorage.removeItem('explicit-login-performed');
          useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      } else {
        console.log('🔍 No stored authentication found');
        useAuthStore.setState({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      }

      hasHydrated = true;
    } catch (error) {
      console.error('❌ Auth store hydration failed:', error);
      hasHydrated = true; // Mark as hydrated even on error to prevent loops
    }
  }
};
