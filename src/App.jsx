import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import DomainsPage from './pages/Domains';
import PackagesPage from './pages/Packages';
import AddPackagePage from './components/Packages/PackageForm';
import AddDomainPage from './components/dashboard/DomainForm';
import ExpiringDomainsPage from './pages/ExpiringSoon';
import ExpiredDomainsPage from './pages/Expired';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFound';
import Hosting from './pages/Hosting';
import Subscription from './pages/Subscription';
import DomainAndHosting from './pages/DomainAndHosting';
import CompanyExpenses from './pages/CompanyExpenses';
import Birthdays from './pages/Birthdays';
import UserManagement from './pages/UserManagement';
import { NotificationProvider } from './components/layout/NotificationContext';

// Simple auth check
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Permission check
const hasPermission = (requiredPermission) => {
  const userRole = localStorage.getItem('userRole') || 'admin';
  if (userRole === 'superadmin') return true; // Super admin has full access
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions')) || {};
  console.log(`hasPermission: Checking ${requiredPermission} for role=${userRole}, permissions=`, userPermissions);
  return userPermissions[requiredPermission] === true;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary: Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected route component
const ProtectedRoute = ({ children, requiredPermission, superAdminOnly = false }) => {
  if (!isAuthenticated()) {
    console.log('ProtectedRoute: Redirecting to /login - User not authenticated');
    return <Navigate to="/login" replace />;
  }

  const userRole = localStorage.getItem('userRole') || 'admin';
  const userEmail = localStorage.getItem('userEmail') || 'unknown';
  console.log(`ProtectedRoute: Checking access for user=${userEmail}, role=${userRole}, permission=${requiredPermission}, superAdminOnly=${superAdminOnly}`);

  if (superAdminOnly && userRole !== 'superadmin') {
    console.log('ProtectedRoute: Redirecting to / - Super admin access required');
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log(`ProtectedRoute: Redirecting to / - Missing permission: ${requiredPermission}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

// Wrapper to debug navigation

const DebugNavigation = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    console.log('DebugNavigation: Current route:', location.pathname);
    console.log('DebugNavigation: userPermissions=', JSON.parse(localStorage.getItem('userPermissions')));
  }, [location]);

  return children;
};

// const DebugNavigation = ({ children }) => {
//   const location = useLocation();

//   useEffect(() => {
//     console.log('DebugNavigation: Current route:', location.pathname);
//   }, [location]);

//   useEffect(() => {
//     const userRole = localStorage.getItem('userRole');
//     const userEmail = localStorage.getItem('userEmail');
//     console.log('DebugNavigation: Setting permissions for', { userRole, userEmail });
//     if (!localStorage.getItem('userPermissions')) {
//       const mockPermissions = {
//         'admin1@tekjuice.co.uk': { dashboard: true, domains: true, hosting: false, subscriptions: false },
//         'admin2@tekjuice.co.uk': { dashboard: true, domains: false, hosting: true, subscriptions: false },
//         'admin@tekjuice.co.uk': { dashboard: true, domains: true, hosting: true, subscriptions: true },
//         'superadmin@tekjuice.co.uk': { dashboard: true, domains: true, hosting: true, subscriptions: true, settings: true },
//       };
//       const permissions = mockPermissions[userEmail] || { dashboard: true, domains: false, hosting: false, subscriptions: false };
//       console.log('DebugNavigation: Setting userPermissions=', permissions);
//       localStorage.setItem('userPermissions', JSON.stringify(permissions));
//     } else {
//       console.log('DebugNavigation: userPermissions already set=', JSON.parse(localStorage.getItem('userPermissions')));
//     }
//   }, []);

//   return children;
// };

const App = () => {
  console.log('App: isAuthenticated=', isAuthenticated());
  console.log('App: userRole=', localStorage.getItem('userRole'));
  console.log('App: userEmail=', localStorage.getItem('userEmail'));
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/" 
          element={
            <NotificationProvider>
              <ProtectedRoute requiredPermission="dashboard">
                <DebugNavigation>
                  <ErrorBoundary>
                    <MainLayout />
                  </ErrorBoundary>
                </DebugNavigation>
              </ProtectedRoute>
            </NotificationProvider>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="domains"
            element={
              <ProtectedRoute requiredPermission="domains">
                <DomainsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="packages"
            element={
              <ProtectedRoute requiredPermission="domains">
                <PackagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="packages/add"
            element={
              <ProtectedRoute requiredPermission="domains">
                <AddPackagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="domains/add"
            element={
              <ProtectedRoute requiredPermission="domains">
                <AddDomainPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expiring"
            element={
              <ProtectedRoute requiredPermission="domains">
                <ExpiringDomainsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expired"
            element={
              <ProtectedRoute requiredPermission="domains">
                <ExpiredDomainsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute superAdminOnly={true} requiredPermission="settings">
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="hosting"
            element={
              <ProtectedRoute requiredPermission="hosting">
                <Hosting />
              </ProtectedRoute>
            }
          />
          <Route
            path="subscriptions"
            element={
              <ProtectedRoute requiredPermission="subscriptions">
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="domain-and-hosting"
            element={
              <ProtectedRoute requiredPermission="domains">
                <ProtectedRoute requiredPermission="hosting">
                  <DomainAndHosting />
                </ProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="birthdays"
            element={
              <ProtectedRoute requiredPermission="birthdays">
                <Birthdays />
              </ProtectedRoute>
            }
          />
          <Route
            path="expense-sync"
            element={
              <ProtectedRoute superAdminOnly={true} requiredPermission="expenseSync">
                <CompanyExpenses />
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;