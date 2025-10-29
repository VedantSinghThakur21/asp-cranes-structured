import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AlertCircle } from 'lucide-react';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [apiState, setApiState] = useState<'loading' | 'available' | 'error'>('loading');
  const { login, error, isAuthenticated, user } = useAuthStore();

  // Debug logging for LoginForm render
  console.log('LoginForm rendering');
  console.log('Auth state:', { error, isAuthenticated });

  useEffect(() => {
    console.log('LoginForm mounted');
    // Check if the API is reachable
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    fetch(`${apiUrl}/health`, {
      // Add credentials and mode to support CORS
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        console.log('API health check response:', response.status);
        setApiState(response.ok ? 'available' : 'error');
        return response.text();
      })
      .then(data => {
        console.log('API health check data:', data);
      })
      .catch(err => {
        console.error('API health check failed:', err);
        setApiState('error');
        setRenderError(
          `API connection error: ${err.message}. Make sure the API server is running at ${apiUrl}`
        );
      });

    // Check for critical environment variables
    console.log('Environment variables check:', {
      apiUrl: import.meta.env.VITE_API_URL || 'not set',
      dbHost: import.meta.env.VITE_DB_HOST || 'not set',
    });
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path if available
  const from = (location.state as LocationState)?.from?.pathname || '/dashboard';

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    console.log('🔍 LoginForm useEffect - Authentication check:', {
      isAuthenticated,
      user: user?.name,
    });
    if (isAuthenticated && user) {
      console.log('✅ User is authenticated, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  // Stabilize the login form by marking it as mounted
  useEffect(() => {
    // Clear any previous JWT token if on login page
    // This ensures we get a fresh token on explicit login
    if (location.pathname === '/login') {
      localStorage.removeItem('jwt-token');
    }
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setRenderError('Email and password are required');
      return;
    }

    setIsLoading(true);
    console.log('🔑 Login attempt for:', email);

    try {
      // Check if API is reachable before attempting login
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      try {
        const healthCheck = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!healthCheck.ok) {
          console.error('API health check failed before login attempt:', await healthCheck.text());
          setApiState('error');
          throw new Error(`API server is not responding correctly. Status: ${healthCheck.status}`);
        }

        setApiState('available');
        console.log('API health check passed, proceeding with login');
      } catch (healthErr) {
        console.error('Failed to connect to API:', healthErr);
        setApiState('error');
        throw new Error('Cannot connect to API. Please ensure the server is running.');
      }

      // Call login function from auth store (now uses PostgreSQL)
      console.log('🔐 Calling auth store login...');
      await login(email, password);
      console.log('✅ Login attempt successful, auth state should be updated');

      // Wait a moment for state to update, then force navigation
      setTimeout(() => {
        const currentState = useAuthStore.getState();
        console.log('🔍 Current auth state after login:', {
          isAuthenticated: currentState.isAuthenticated,
          user: currentState.user?.name,
          userRole: currentState.user?.role,
          token: currentState.token ? 'Present' : 'Missing',
          fullUser: currentState.user,
        });

        // Force navigation if authenticated
        if (currentState.isAuthenticated && currentState.user) {
          console.log('🚀 Forcing navigation to dashboard...');
          console.log(
            '👤 User object before navigation:',
            JSON.stringify(currentState.user, null, 2)
          );
          navigate('/dashboard', { replace: true });
        } else {
          console.log('❌ Auth state not updated properly, user may need to refresh');
        }
      }, 500);

      // Login will update isAuthenticated, triggering the redirect effect
    } catch (err) {
      console.error('Login error:', err);

      // Auth store already tracks the error, but we might want to clear password
      // Show a specific error message for HTML responses
      if (err instanceof Error) {
        if (err.message.includes('<!DOCTYPE') || err.message.includes('<html>')) {
          const apiUrl = import.meta.env.VITE_API_URL || '/api';
          setRenderError(`API returned HTML instead of JSON. The API server might not be running correctly. 
            Make sure the API server is running at ${apiUrl}.`);
        } else if (
          err.message.includes('NetworkError') ||
          err.message.includes('Failed to fetch')
        ) {
          setRenderError(`Network error: Cannot connect to API server. 
            Please check your network connection and make sure the server is running.`);
        }
      }

      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rendering errors
  if (renderError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <div className="w-full max-w-md px-6 py-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Rendering Login Form</h2>
          <p className="text-gray-700 mb-4">{renderError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show API status
  if (apiState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <div className="w-full max-w-md px-6 py-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">API Connection Error</h2>
          <p className="text-gray-700 mb-4">
            Unable to connect to the API server. The server might not be running.
            <br />
            API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}
          </p>
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Troubleshooting steps:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure the API server is running</li>
              <li>Check your .env file configuration</li>
              <li>Verify database connection settings</li>
              <li>Check browser console for network errors</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Try to render the form with error handling
  try {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Email address"
              className="w-full border-0 border-b border-gray-300 focus:border-black focus:ring-0 text-base py-3 px-0 bg-transparent placeholder-gray-400 outline-none text-[#222] font-semibold"
              style={{ color: '#222', WebkitTextFillColor: '#222', background: 'transparent' }}
            />
          </div>
          <div>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full border-0 border-b border-gray-300 focus:border-black focus:ring-0 text-base py-3 px-0 bg-transparent placeholder-gray-400 outline-none text-[#222] font-semibold"
              style={{ color: '#222', WebkitTextFillColor: '#222', background: 'transparent' }}
            />
          </div>
        </div>
        <div className="flex justify-end text-xs mt-1">
          <a href="#" className="text-blue-700 hover:underline">
            Forget password <span className="font-bold">Click here</span>
          </a>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-black text-white rounded-md text-lg font-semibold mt-2 transition-colors duration-150 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login Now'}
        </button>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </form>
    );
  } catch (err) {
    console.error('Error rendering login form:', err);
    setRenderError(
      `Error rendering login form: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}
