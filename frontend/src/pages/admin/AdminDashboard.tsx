// frontend/src/pages/admin/AdminDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, DollarSign, AlertTriangle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getDashboardStats,
  });

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: 'blue',
    },
    {
      title: 'Total Revenue',
      value: `GHS ${stats?.total_revenue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: AlertTriangle,
      color: 'yellow',
    },
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'purple',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your admin dashboard</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Low Stock Alert */}
        {stats && stats.low_stock_products > 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">
                {stats.low_stock_products} product{stats.low_stock_products !== 1 ? 's' : ''} running low on stock
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}