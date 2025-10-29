// ...existing code...

/**
 * Client-side Auth Service
 *
 * This service provides authentication functionality using API calls.
 * It serves as a frontend-only replacement for the postgresAuthService.
 */

import { User } from '../types/auth';
// Simple JWT decode (frontend safe, no verification)
function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    return {};
  }
}

// API request headers
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const authToken = localStorage.getItem('jwt-token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

/**
 * Sign in a user with email and password
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔑 Starting sign in process for:', email);
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      throw new Error('VITE_API_URL is not set in the environment.');
    }
    const loginUrl = `${apiUrl}/auth/login`;
    console.log('Login URL:', loginUrl);
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      let errorMessage = 'Authentication failed';
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) errorMessage = errorData.message;
      } catch (e) {
        // If response is not JSON, keep default error message
      }
      throw new Error(errorMessage);
    }
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid response from server.');
    }
    const { token, user } = data;
    if (!user || !user.id || !user.email || !token) {
      throw new Error('Invalid user data received from server');
    }
    if (
      !user.role ||
      !['admin', 'sales_agent', 'operations_manager', 'operator', 'support'].includes(user.role)
    ) {
      console.warn('⚠️ User role missing or invalid, assigning default role');
      user.role = 'admin';
    }
    localStorage.setItem('jwt-token', token);
    console.log('✅ Authentication successful');
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    // Call logout endpoint
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getHeaders(),
    });

    // Clear local storage
    localStorage.removeItem('jwt-token');
  } catch (error) {
    console.error('Error signing out:', error);

    // Still clear token even if API call fails
    localStorage.removeItem('jwt-token');
  }
};

/**
 * Get the current user from token
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('jwt-token');

    if (!token) {
      return null;
    }

    // First try to decode the token without verification
    const decoded = decodeJwt(token);

    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('jwt-token');
      return null;
    }

    // Since /api/auth/me doesn't exist, we'll decode the JWT directly
    // This is safe because we trust our own backend-generated tokens
    console.log('🔍 getCurrentUser: Decoding JWT token directly');

    const user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    console.log('✅ getCurrentUser: User from JWT:', JSON.stringify(user, null, 2));

    // Validate user object
    if (!user.id || !user.email || !user.role) {
      console.error('❌ getCurrentUser: Invalid user data in JWT');
      localStorage.removeItem('jwt-token');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('jwt-token');
    return null;
  }
};

/**
 * Update user password
 */
export const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/auth/users/${userId}/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      throw new Error('Failed to update password');
    }

    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Default export for compatibility with default imports
const authService = {
  signIn,
  signOutUser,
  getCurrentUser,
  updateUserPassword,
};

export default authService;
