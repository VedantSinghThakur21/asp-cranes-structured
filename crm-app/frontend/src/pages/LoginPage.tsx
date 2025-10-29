import { Component, ReactNode, useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

// Login error fallback component
function LoginErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f0f2f5',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '16px', color: '#e53e3e' }}>Login Error</h1>
        <p style={{ marginBottom: '24px' }}>We encountered a problem with the login form.</p>
        <div
          style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '24px',
            textAlign: 'left',
            overflowWrap: 'break-word',
          }}
        >
          <code style={{ color: '#e53e3e' }}>{error.message}</code>
        </div>
        <button
          onClick={resetError}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Custom error boundary for login
class LoginErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Login page error:', error);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <LoginErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Main login content component
function LoginContent() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-[#F2EEE7]">
      {/* Left: Branding Panel */}
      <div className="relative flex-1 flex flex-col justify-center items-center bg-gradient-to-br from-[#385197] to-[#404040] text-white px-8 py-12 overflow-hidden">
        {/* SVG lines for visual interest */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 800 Q400 400 800 800" stroke="white" strokeWidth="2" />
          <path d="M0 600 Q400 200 800 600" stroke="white" strokeWidth="1.5" />
          <path d="M0 400 Q400 0 800 400" stroke="white" strokeWidth="1" />
        </svg>
        <div className="relative z-10 flex flex-col items-start max-w-lg w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight flex items-center gap-2">
            <span className="text-white drop-shadow-lg">Hello,</span>
            <span className="text-[#FFCC3F] drop-shadow-[0_2px_8px_rgba(255,204,63,0.7)]">
              ASP Cranes!
            </span>
            <span className="inline-block text-5xl ml-2 align-middle">👋</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold mb-8 text-white drop-shadow-lg tracking-wide">
            The all-in-one platform to supercharge your heavy equipment rental business.
          </p>
          <p className="text-xs opacity-60 mt-12">
            © {new Date().getFullYear()} ASP Cranes. All rights reserved.
          </p>
        </div>
      </div>
      {/* Right: Futuristic Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#F2EEE7] px-6">
        <div className="w-full max-w-md mx-auto relative">
          {/* Futuristic glassmorphism background */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-xl border border-[#CAC0B0]/60 shadow-2xl"
            style={{ zIndex: 1 }}
          ></div>
          <div className="relative z-10 p-10 flex flex-col">
            <h2 className="text-2xl font-bold text-[#404040] mb-2 flex items-center gap-2">
              Welcome Back! <span className="text-[#FFCC3F]">●</span>
            </h2>
            <p className="text-[#385197] mb-6 text-sm">
              Don&apos;t have an account?{' '}
              <a href="#" className="text-[#FFCC3F] font-medium hover:underline">
                Create a new account now
              </a>
              .<br />
              It&apos;s FREE! Takes less than a minute.
            </p>
            <LoginForm />
          </div>
          {/* Futuristic accent lines */}
          <svg
            className="absolute -top-8 -right-8 w-32 h-32 opacity-30"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="48" stroke="#FFCC3F" strokeWidth="2" />
            <circle cx="50" cy="50" r="40" stroke="#385197" strokeWidth="1" />
          </svg>
          <svg
            className="absolute -bottom-8 -left-8 w-24 h-24 opacity-20"
            viewBox="0 0 100 100"
            fill="none"
          >
            <rect x="10" y="10" width="80" height="80" rx="20" stroke="#404040" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Main LoginPage component with error boundary
export function LoginPage() {
  // Debug logging for development
  useEffect(() => {
    console.log('LoginPage mounted');
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    console.log('API URL:', apiUrl);
  }, []);

  return (
    <LoginErrorBoundary>
      <LoginContent />
    </LoginErrorBoundary>
  );
}
