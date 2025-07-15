import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate
} from 'react-router-dom';
import { Suspense } from 'react';
import { AuthErrorBoundary } from './components/auth/AuthErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { AdminDashboard } from './pages/AdminDashboard';
import { SalesAgentDashboard } from './pages/SalesAgentDashboard';
import { OperationsManagerDashboard } from './pages/OperationsManagerDashboard';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { LeadManagement } from './pages/LeadManagement';
import { QuotationManagement } from './pages/QuotationManagement';
import { QuotationCreation } from './pages/QuotationCreation';
import { JobScheduling } from './pages/JobScheduling';
import { JobTest } from './pages/JobTest';
import { SiteAssessment } from './pages/SiteAssessment';
import { JobSummaryFeedback } from './pages/JobSummaryFeedback';
import { EquipmentManagement } from './pages/EquipmentManagement';
import { ServicesManagement } from './pages/ServicesManagement';
import { UserManagement } from './pages/UserManagement';
import { Config } from './pages/Config';
import { Customers } from './pages/Customers';
import { Deals } from './pages/Deals';
import { DealDetails } from './pages/DealDetails';
import { useAuthStore } from './store/authStore';
import { QuotationTemplates } from './pages/QuotationTemplates';
import { QuotationTemplateEditor } from './pages/QuotationTemplateEditor';
import { AuthProvider } from './components/auth/SimpleAuthProvider';
import { ProtectedRoute } from './components/auth/SimpleProtectedRoute';

// Pre-determine the appropriate dashboard component based on user role
function DashboardRouter() {
  const { user, isAuthenticated } = useAuthStore();
  
  console.log('🎯 DashboardRouter called');
  console.log('🔍 Authentication state:', { isAuthenticated });
  console.log('👤 User object:', JSON.stringify(user, null, 2));
  console.log('🏷️ User role:', user?.role);
  
  // This should never actually happen because of ProtectedRoute,
  // but it's a safety check
  if (!isAuthenticated || !user) {
    console.log('❌ DashboardRouter: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Check for role
  if (!user.role) {
    console.error('❌ DashboardRouter: User authenticated but role is undefined!');
    console.error('📊 Full user object:', user);
    
    // Try to show admin dashboard as fallback
    console.log('🔄 Fallback: Showing AdminDashboard due to missing role');
    return <AdminDashboard />;
  }
  
  console.log('✅ DashboardRouter: User role is', user.role);
  
  // Return the appropriate dashboard based on role
  switch (user.role) {
    case 'admin':
      console.log('📊 Rendering AdminDashboard');
      return <AdminDashboard />;
    case 'sales_agent':
      console.log('📊 Rendering SalesAgentDashboard');
      return <SalesAgentDashboard />;
    case 'operations_manager':
      console.log('📊 Rendering OperationsManagerDashboard');
      return <OperationsManagerDashboard />;
    case 'operator':
      console.log('📊 Rendering OperatorDashboard');
      return <OperatorDashboard />;
    default:
      console.log('❌ Unknown user role:', user.role, 'showing AdminDashboard as fallback');
      return <AdminDashboard />;
  }
}

// Error fallback component for error boundaries
export function ErrorFallback() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-6">We encountered an error loading your dashboard.</p>
      <button 
        onClick={() => {
          // Clear potential error state
          sessionStorage.clear();
          localStorage.clear();
          window.location.href = '/login';
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Return to Login
      </button>
    </div>
  );
}

function AppContent() {
  // Force render login page if URL is empty or root
  const isRootUrl = window.location.pathname === '/' || window.location.pathname === '';
  
  console.log('🔍 AppContent - Current pathname:', window.location.pathname);
  console.log('🔍 AppContent - Is root URL:', isRootUrl);
  
  // If we're at root URL, use React Router's Navigate for better SPA experience
  if (isRootUrl) {
    console.log('📍 Redirecting from root to /login');
    return <Navigate to="/login" replace />;
  }
  
  // Enhanced fallback with better loading experience
  const fallbackContent = (
    <div className="fixed inset-0 bg-white flex min-h-screen items-center justify-center z-50 loading-screen">
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-lg text-gray-700 font-medium">Loading ASP Cranes CRM...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your dashboard</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallbackContent}>
      <Routes>
        {/* Direct access to diagnostic pages */}
        <Route path="/blank-check.html" element={<Navigate to="/blank-check.html" replace />} />
        <Route path="/api-test.html" element={<Navigate to="/api-test.html" replace />} />
        
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes that require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRouter />} />
            
            {/* Admin Only Routes */}
            <Route path="admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            <Route path="admin/config" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Config />
              </ProtectedRoute>
            } />
            
            <Route path="admin/equipment" element={
              <ProtectedRoute allowedRoles={['admin', 'operations_manager']}>
                <EquipmentManagement />
              </ProtectedRoute>
            } />
            
            <Route path="admin/services" element={
              <ProtectedRoute allowedRoles={['admin', 'operations_manager']}>
                <ServicesManagement />
              </ProtectedRoute>
            } />
            
            <Route path="admin/quotation-templates" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent']}>
                <QuotationTemplates />
              </ProtectedRoute>
            } />
            
            <Route path="admin/quotation-templates/edit/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent']}>
                <QuotationTemplateEditor />
              </ProtectedRoute>
            } />
            
            {/* Shared Routes for Multiple Roles */}
            <Route path="leads" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}>
                <LeadManagement />
              </ProtectedRoute>
            } />
            
            <Route path="customers" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}>
                <Customers />
              </ProtectedRoute>
            } />
            
            <Route path="deals" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}>
                <Deals />
              </ProtectedRoute>
            } />
            
            <Route path="deals/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}>
                <DealDetails />
              </ProtectedRoute>
            } />
            
            <Route path="quotations" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}>
                <QuotationManagement />
              </ProtectedRoute>
            } />
            
            <Route path="quotations/create" element={
              <ProtectedRoute allowedRoles={['admin', 'sales_agent']}>
                <QuotationCreation />
              </ProtectedRoute>
            } />
            
            <Route path="jobs" element={
              <ProtectedRoute allowedRoles={['admin', 'operations_manager', 'operator']}>
                <JobScheduling />
              </ProtectedRoute>
            } />
            
            <Route path="job-test" element={
              <ProtectedRoute allowedRoles={['admin', 'operations_manager', 'operator']}>
                <JobTest />
              </ProtectedRoute>
            } />
            
            <Route path="site-assessments" element={
              <ProtectedRoute allowedRoles={['admin', 'operations_manager', 'operator']}>
                <SiteAssessment />
              </ProtectedRoute>
            } />
            
            <Route path="job-summary" element={
              <ProtectedRoute allowedRoles={['admin', 'operations_manager', 'operator']}>
                <JobSummaryFeedback />
              </ProtectedRoute>
            } />
            
            {/* Catch All - Redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AuthErrorBoundary>
          <AppContent />
        </AuthErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
