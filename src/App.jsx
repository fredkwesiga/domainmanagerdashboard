import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext'; // Import useUser
import { NotificationProvider } from './components/layout/NotificationContext';
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
import SubscriptionForm from './pages/SubscriptionForm';
import DomainAndHosting from './pages/DomainAndHosting';
import CompanyExpenses from './pages/CompanyExpenses';
import Birthdays from './pages/Birthdays';
import UserManagement from './pages/UserManagement';
import HostingForm from './pages/HostingForm';
import BirthdayForm from './pages/BirthdayForm';
import Profile from './pages/Profile';

// Simple auth check
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Permission check using UserContext
const hasPermission = (requiredPermission, userPermissions, userRole) => {
  if (userRole === 'superadmin') return true; // Super admin has full access
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
  const { userPermissions } = useUser(); // Use UserContext
  const userRole = localStorage.getItem('userRole') || 'admin';
  const userEmail = localStorage.getItem('userEmail') || 'unknown';

  if (!isAuthenticated()) {
    console.log('ProtectedRoute: Redirecting to /login - User not authenticated');
    return <Navigate to="/login" replace />;
  }

  console.log(`ProtectedRoute: Checking access for user=${userEmail}, role=${userRole}, permission=${requiredPermission}, superAdminOnly=${superAdminOnly}`);

  if (superAdminOnly && userRole !== 'superadmin') {
    console.log('ProtectedRoute: Redirecting to / - Super admin access required');
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission, userPermissions, userRole)) {
    console.log(`ProtectedRoute: Redirecting to / - Missing permission: ${requiredPermission}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

// Wrapper to debug navigation
const DebugNavigation = ({ children }) => {
  const location = useLocation();
  const { userPermissions } = useUser(); // Use UserContext

  useEffect(() => {
    console.log('DebugNavigation: Current route:', location.pathname);
    console.log('DebugNavigation: userPermissions=', userPermissions);
  }, [location, userPermissions]);

  return children;
};

const App = () => {
  console.log('App: isAuthenticated=', isAuthenticated());
  console.log('App: userRole=', localStorage.getItem('userRole'));
  console.log('App: userEmail=', localStorage.getItem('userEmail'));
  return (
    <UserProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute requiredPermission="dashboard">
                  <DebugNavigation>
                    <ErrorBoundary>
                      <MainLayout />
                    </ErrorBoundary>
                  </DebugNavigation>
                </ProtectedRoute>
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
                path="subscriptions/add"
                element={
                  <ProtectedRoute requiredPermission="subscriptions">
                    <SubscriptionForm />
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
                path="birthdays/add"
                element={
                  <ProtectedRoute requiredPermission="birthdays">
                    <BirthdayForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="birthdays/edit/:id"
                element={
                  <ProtectedRoute requiredPermission="birthdays">
                    <BirthdayForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hosting/add"
                element={
                  <ProtectedRoute requiredPermission="hosting">
                    <HostingForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </UserProvider>
  );
};

export default App;