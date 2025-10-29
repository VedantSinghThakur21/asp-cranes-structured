/**
 * main.tsx - Entry point for ASP Cranes CRM
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// import { hydrateAuthStore } from './store/authStore';

// Initialize and render the app immediately without waiting for auth hydration
console.log('🚀 Starting ASP Cranes CRM...');
console.log('🔍 Current URL:', window.location.href);
console.log('💾 localStorage contents:', {
  'jwt-token': localStorage.getItem('jwt-token') ? 'Present' : 'Missing',
  'explicit-login-performed': localStorage.getItem('explicit-login-performed'),
  'auth-storage': localStorage.getItem('auth-storage') ? 'Present' : 'Missing',
});

// Hydrate auth store - TEMPORARILY DISABLED
console.log('🔄 Auth store hydration temporarily disabled for debugging');
// hydrateAuthStore()
//   .then(() => console.log('✅ Auth store hydration completed'))
//   .catch(error => console.error('❌ Auth store hydration failed:', error));

// Force dark mode for testing
if (!document.body.classList.contains('dark')) {
  document.body.classList.add('dark');
}

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Failed to find root element');
  document.body.innerHTML =
    '<div style="padding: 20px; font-family: Arial; color: red;">Error: Root element not found</div>';
} else {
  console.log('✅ Root element found, creating React app...');

  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen bg-gray-100">
              <div className="text-center">
                <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading ASP Cranes CRM...</p>
              </div>
            </div>
          }
        >
          <App />
        </Suspense>
      </StrictMode>
    );
    console.log('🎉 React application rendered successfully');
  } catch (error) {
    console.error('❌ React render error:', error);
    rootElement.innerHTML =
      '<div style="padding: 20px; font-family: Arial; color: red;">React render error: ' +
      error +
      '</div>';
  }
}
