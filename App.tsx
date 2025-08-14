
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HodDashboard from './pages/HodDashboard';
import DeanDashboard from './pages/DeanDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: UserRole }> = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    // Redirect to their default dashboard if they try to access a page they don't have permission for
    switch(user.role) {
      case UserRole.ADMIN: return <Navigate to="/admin" replace />;
      case UserRole.DEAN: return <Navigate to="/dean" replace />;
      case UserRole.HOD: return <Navigate to="/hod" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }
  return <>{children}</>;
};

const RootRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    switch (user.role) {
        case UserRole.ADMIN: return <Navigate to="/admin" replace />;
        case UserRole.DEAN: return <Navigate to="/dean" replace />;
        case UserRole.HOD: return <Navigate to="/hod" replace />;
        default: return <Navigate to="/login" replace />;
    }
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/hod" element={
                <ProtectedRoute role={UserRole.HOD}>
                    <HodDashboard />
                </ProtectedRoute>
            } />
            <Route path="/dean" element={
                <ProtectedRoute role={UserRole.DEAN}>
                    <DeanDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute role={UserRole.ADMIN}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/" element={<RootRedirect />} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <NotificationProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </NotificationProvider>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
