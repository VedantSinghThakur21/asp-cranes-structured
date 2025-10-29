import { ReactNode, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getCurrentUser } from '../../services/authService';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children?: ReactNode;
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

/**
 * A simplified ProtectedRoute component with PostgreSQL authentication
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // Verify JWT token on protected route access
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Production-ready authentication check with proper PostgreSQL implementation
        const currentUser = await getCurrentUser();

        if (currentUser) {
          // Update user in store if needed
          if (!user || user.id !== currentUser.id) {
            setUser(currentUser);
          }
        } else {
          // Token is invalid or expired - clear authentication
          localStorage.removeItem('jwt-token');
          localStorage.removeItem('user');
          localStorage.removeItem('explicit-login-performed');
        }
      } catch (error) {
        console.error('Error verifying token:', error);

        // Token is invalid - clear authentication
        localStorage.removeItem('jwt-token');
        localStorage.removeItem('user');
        localStorage.removeItem('explicit-login-performed');
      } finally {
        // Always mark as done checking
        setIsChecking(false);
      }
    };

    verifyToken();
  }, [user, setUser]);

  // Show loading while checking token
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Debug log authentication state when rendering a protected route
  console.log(
    `🔒 Protected Route Check - Authenticated: ${isAuthenticated}, User: ${user?.name || 'none'}`
  );

  // Basic check - no auth, no access
  if (!isAuthenticated || !user) {
    console.log(`❌ Route protection failed - redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // Role check - if allowedRoles is specified, check if user has one of those roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(
      `❌ Role protection failed - user has ${user.role} but needs one of [${allowedRoles.join(',')}]`
    );
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed - render children or outlet
  console.log('✅ Route protection passed - rendering protected content');

  return children ? <>{children}</> : <Outlet />;
}
