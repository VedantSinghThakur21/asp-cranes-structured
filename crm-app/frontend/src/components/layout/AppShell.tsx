import React, { useState, useEffect, useRef, memo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  requiredRole?: string;
  children?: React.ReactNode;
}

export const AppShell = memo(function AppShell({ requiredRole, children }: AppShellProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const authChecked = useRef(false);

  // Add sidebar logout event listener
  useEffect(() => {
    const handleSidebarLogout = () => {
      logout()
        .then(() => {
          navigate('/login');
        })
        .catch(error => {
          console.error('Logout error:', error);
          navigate('/login');
        });
    };

    document.addEventListener('sidebar-logout', handleSidebarLogout);

    return () => {
      document.removeEventListener('sidebar-logout', handleSidebarLogout);
    };
  }, [logout, navigate]);

  // Simplified auth check
  useEffect(() => {
    if (authChecked.current) return;

    const validateAuth = async () => {
      try {
        if (!isAuthenticated || !user) {
          console.log('❌ Not authenticated, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        if (requiredRole && user.role !== requiredRole) {
          console.log(`❌ Role mismatch: required ${requiredRole}, got ${user.role}`);
          navigate('/dashboard', { replace: true });
          return;
        }

        authChecked.current = true;
      } catch (error) {
        console.error('Auth validation error:', error);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, [navigate, isAuthenticated, user, requiredRole]);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-brand-gold rounded-full animate-spin"
              style={{ animationDelay: '0.2s', animationDuration: '1.5s' }}
            />
          </div>
          <h3 className="text-lg font-semibold text-brand-blue">Loading Application</h3>
          <p className="text-sm text-gray-600 mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onCollapseToggle={setIsSidebarCollapsed}
      />
      {/* Main content area */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}
      >
        {/* Header */}
        <Header onMobileMenuClick={toggleMobileSidebar} />
        {/* Main content with enhanced styling */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
          <div className="min-h-full">{children || <Outlet />}</div>
        </main>
      </div>
    </div>
  );
});
