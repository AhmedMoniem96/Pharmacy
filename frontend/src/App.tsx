import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Products } from './pages/Products';
import { Purchasing } from './pages/Purchasing';
import { Toaster } from './components/ui/toaster';
import { useTranslation } from 'react-i18next';

const ProtectedRoute: React.FC = () => {
  const { token, isLoading, user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    console.log('[ProtectedRoute] State update:', { isLoading, hasToken: !!token, user: user?.username });
  }, [isLoading, token, user]);

  if (isLoading) {
    console.log('[ProtectedRoute] Showing loading state.');
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-medium">
        {t('loading')}...
      </div>
    );
  }

  if (!token) {
    console.log('[ProtectedRoute] No token, redirecting to /login.');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Token found, rendering Layout.');
  return <Layout />;
};

const App: React.FC = () => {
  console.log('[App] Rendering App component.');
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchasing" element={<Purchasing />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;