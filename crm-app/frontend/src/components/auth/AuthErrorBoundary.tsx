import { Component, ReactNode } from 'react';

interface AuthErrorBoundaryProps {
  children: ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component for catching authentication-related errors
 * This provides a centralized way to handle auth errors with a user-friendly UI
 */
class AuthErrorBoundaryClass extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Filter for authentication-related errors
    const isAuthError =
      error.message.includes('Authentication required') ||
      error.message.includes('JWT') ||
      error.message.includes('401') ||
      error.message.includes('token') ||
      error.message.includes('unauthorized');

    // Only catch auth-related errors
    if (isAuthError) {
      return { hasError: true, error };
    }

    // For other errors, propagate up to the next error boundary
    throw error;
  }

  componentDidCatch(error: Error): void {
    console.error('Auth Error Boundary caught error:', error);

    // Log to analytics or monitoring service
    // reportErrorToAnalytics(error);
  }

  resetErrorState = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  handleLogout = (): void => {
    // Clear all auth state
    localStorage.removeItem('jwt-token');
    localStorage.removeItem('explicit-login-performed');
    localStorage.removeItem('auth-storage');

    // Force page reload to login
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      // Error fallback UI
      return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-6">
              We encountered an authentication error. Your session may have expired or been
              invalidated.
            </p>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">
                Error: {this.state.error?.message || 'Authentication failed'}
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Return to Login
              </button>
              <button
                onClick={this.resetErrorState}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper with React Router's navigate
export function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  return <AuthErrorBoundaryClass>{children}</AuthErrorBoundaryClass>;
}
