import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Admin Imports
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import AdminProducts from './components/admin/AdminProducts';
import AdminBrands from './components/admin/AdminBrands';
import AdminWallets from './components/admin/AdminWallets';
import AdminGame from './components/admin/AdminGame';
import AdminContent from './components/admin/AdminContent';
import AdminWidgets from './components/admin/AdminWidgets';
import AdminCategories from './components/admin/AdminCategories';
import AdminReviews from './components/admin/AdminReviews';

const AdminPlaceholder = ({ title }: { title: string }) => (
  <div className="p-10 text-center text-app-textSec font-bold text-xl">صفحة {title} قيد التطوير</div>
);

const AppContent: React.FC<{ onAdminLogout: () => void }> = ({ onAdminLogout }) => {
  return (
    <div className="w-full min-h-screen">
      <Routes>
        {/* Redirect root to admin login */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Admin Login Route (Not Protected) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={
          <ProtectedAdminRoute>
            <AdminLayout onAdminLogout={onAdminLogout} />
          </ProtectedAdminRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="widgets" element={<AdminWidgets />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="wallets" element={<AdminWallets />} />
          <Route path="game" element={<AdminGame />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="customers" element={<AdminPlaceholder title="العملاء" />} />
          <Route path="reports" element={<AdminPlaceholder title="التقارير" />} />
          <Route path="users" element={<AdminPlaceholder title="الصلاحيات" />} />
          <Route path="settings" element={<AdminPlaceholder title="الإعدادات" />} />
        </Route>

        {/* Redirect all unknown routes to admin login */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

// Protected Admin Route Wrapper
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const adminToken = localStorage.getItem('admin_token');

  if (!adminToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_permissions');
    // Force reload to reset state and redirect to login
    window.location.hash = '/admin/login';
  };

  return (
    <Router>
      <Toaster position="top-center" expand={false} richColors />
      <AppContent onAdminLogout={handleAdminLogout} />
    </Router>
  );
};

export default App;
