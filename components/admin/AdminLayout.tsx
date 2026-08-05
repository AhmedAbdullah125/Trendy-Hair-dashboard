
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Wallet,
  Gamepad2, Home, FileBarChart, Settings,
  LogOut, Menu, X, Bell, Search, ShieldCheck, Layers, Tag, Grid, Star, Trash2
} from 'lucide-react';
import { useAdminTokenRefresh } from '../../hooks/useAdminTokenRefresh';
import { PERMISSIONS, useAdminPermissions } from '../../lib/permissions';
import { toast } from 'sonner';

const AdminLayout: React.FC<{ onAdminLogout: () => void }> = ({ onAdminLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-refresh admin token
  useAdminTokenRefresh();

  const { can } = useAdminPermissions();

  // `disabled` is optional and currently unused, but the rendering below still
  // honours it — keep it on the type so re-adding a not-ready screen is a
  // one-line change rather than a type error.
  const menuItems: Array<{ icon: React.ReactNode; label: string; path: string; disabled?: boolean; permission?: string }> = [
    { icon: <ShoppingBag size={20} />, label: 'الطلبات', path: '/admin/orders' },
    { icon: <LayoutDashboard size={20} />, label: 'التحليلات', path: '/admin/dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { icon: <Package size={20} />, label: 'المنتجات', path: '/admin/products' },
    { icon: <Grid size={20} />, label: 'الأقسام', path: '/admin/categories', permission: PERMISSIONS.VIEW_CATEGORIES },
    { icon: <Tag size={20} />, label: 'العلامات التجارية', path: '/admin/brands' },
    //banners
    { icon: <Tag size={20} />, label: 'البنرات', path: '/admin/banners' },
    { icon: <Users size={20} />, label: 'المدراء', path: '/admin/admins' },
    { icon: <Users size={20} />, label: 'الموظفين', path: '/admin/employees' },
    { icon: <Users size={20} />, label: 'العملاء', path: '/admin/customers' },
    { icon: <Star size={20} />, label: 'المراجعات', path: '/admin/reviews' },
    { icon: <Layers size={20} />, label: 'المحافظات والمدن', path: '/admin/locations' },
    // { icon: <Layers size={20} />, label: 'ودجات الرئيسية', path: '/admin/widgets' },
    { icon: <Gamepad2 size={20} />, label: 'مسابقة تريندي', path: '/admin/game' },
    { icon: <Wallet size={20} />, label: 'المحفظة والنقاط', path: '/admin/wallets' },
    { icon: <Settings size={20} />, label: 'الإعدادات والمحتوى', path: '/admin/content' },
    // Hidden for now — the screens behind these are not ready yet.
    // { icon: <FileBarChart size={20} />, label: 'التقارير', path: '/admin/reports', disabled: true },
    // { icon: <Settings size={20} />, label: 'الإعدادات', path: '/admin/settings', disabled: true },
  ];



  // Entries without a `permission` stay visible: the backend defines no
  // permission for them, so gating would hide working screens from everyone.
  const visibleMenuItems = menuItems.filter((item) => !item.permission || can(item.permission));

  return (
    <div className="flex h-screen bg-[#F7F4EE] font-alexandria overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`
          bg-white shadow-xl z-20 transition-all duration-300 flex flex-col fixed md:relative h-full
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 translate-x-full md:w-20 md:translate-x-0'}
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-app-card/30 h-20">
          <Link to="/admin/dashboard" className={`text-xl font-bold text-app-goldDark truncate transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            لوحة الإدارة
          </Link>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label={isSidebarOpen ? "طي القائمة" : "توسيع القائمة"} aria-expanded={isSidebarOpen} className="text-app-textSec hover:text-app-gold hidden md:block">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button onClick={() => setIsSidebarOpen(false)} aria-label="إغلاق القائمة" className="text-app-textSec md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-1 px-3">
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  toast('feature under developing');
                }
              }}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isActive && !item.disabled
                  ? 'bg-app-gold text-white shadow-md shadow-app-gold/20'
                  : 'text-app-textSec' + (item.disabled ? '' : ' hover:bg-app-bg hover:text-app-goldDark')
                }
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className={`whitespace-nowrap transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-app-card/30 flex flex-col gap-2">


          <button
            onClick={() => {
              onAdminLogout();
              navigate('/admin/login');
            }}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className={`whitespace-nowrap transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
              تسجيل الخروج
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white h-20 shadow-sm border-b border-app-card/30 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} aria-label="فتح القائمة" className="md:hidden text-app-text">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-app-text">
              {menuItems.find(i => i.path === location.pathname)?.label || 'لوحة التحكم'}
            </h2>
          </div>

          {/* <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="بحث سريع..."
                className="bg-app-bg border border-app-card/50 rounded-full px-4 py-2 pr-10 text-sm focus:outline-none focus:border-app-gold w-64"
              />
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-textSec" />
            </div>
            
            <button className="relative p-2 rounded-full hover:bg-app-bg text-app-textSec transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>


          </div> */}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
