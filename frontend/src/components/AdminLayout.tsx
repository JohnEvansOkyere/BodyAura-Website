// frontend/src/components/AdminLayout.tsx

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Home, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition touch-manipulation"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-bold text-primary-600">Admin Panel</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop always visible, Mobile drawer */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:min-h-screen
        `}>
          <div className="p-4 sm:p-6 border-b border-gray-200 hidden lg:block">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-600">Admin Panel</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{user?.full_name}</p>
          </div>

          <nav className="p-4 space-y-2 mt-16 lg:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition touch-manipulation ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
            <button
              onClick={() => {
                closeSidebar();
                navigate('/');
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition w-full touch-manipulation"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Back to Store</span>
            </button>

            <button
              onClick={() => {
                closeSidebar();
                logout();
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 transition w-full touch-manipulation"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {children}
      </main>
    </div>
  );
}