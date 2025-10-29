import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getCurrentUser } from '../../services/authService';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, user, setUser } = useAuthStore();

  useEffect(() => {
    // Auto-login check - try to get current user from API/local storage
    const checkAuthStatus = async () => {
      try {
        if (!isAuthenticated && !user) {
          // Standard PostgreSQL authentication flow
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      }
    };

    checkAuthStatus();
  }, [isAuthenticated, user, setUser]);

  return <>{children}</>;
};
