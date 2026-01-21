import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
  const { token, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-medium">
        {t('loading')}...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />; // Layout will render its children via Outlet
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchasing" element={<Purchasing />} />
          {/* Add other protected routes here */}
        </Route>

        {/* Catch-all for unmatched routes (optional) */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;