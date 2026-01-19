// frontend/src/pages/admin/AdminDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import {
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/AdminLayout';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statCards = [
    {
      title: 'Total Revenue',
      value: `GHS ${stats?.total_revenue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      subtitle: `+${stats?.new_users_this_month || 0} this month`,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
    {
      title: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Low Stock Items',
      value: stats?.low_stock_products || 0,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'processing':
        return Truck;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Welcome to your admin dashboard - Real-time insights at a glance</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-3 sm:p-4 md:p-6 animate-pulse">
                <div className="h-20 sm:h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="card p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 truncate">{stat.value}</p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 flex items-center">
                          <ArrowUp className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                          <span className="truncate">{stat.subtitle}</span>
                        </p>
                      )}
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 ${stat.bgColor} rounded-full flex items-center justify-center flex-shrink-0 ml-2`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sales Trend Chart */}
        {stats?.sales_trend && stats.sales_trend.length > 0 && (
          <div className="card p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Sales Trend</h2>
                <p className="text-xs sm:text-sm text-gray-600">Last 7 days performance</p>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-4">
              {stats.sales_trend.map((day: any, index: number) => {
                const maxRevenue = Math.max(...stats.sales_trend.map((d: any) => d.revenue));
                const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 w-12">{day.day}</span>
                        <span className="text-xs text-gray-500">{day.date}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">GHS {day.revenue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{day.orders} orders</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
          {/* Top Performing Products */}
          {stats?.top_products && stats.top_products.length > 0 && (
            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">Top Products</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Best sellers by revenue</p>
                </div>
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
              </div>

              <div className="space-y-3 sm:space-y-4">
                {stats.top_products.map((product: any, index: number) => (
                  <div
                    key={product.product_id}
                    className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 p-2 sm:p-3 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition cursor-pointer touch-manipulation"
                  >
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm mb-1 truncate">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-1 truncate">{product.category}</p>
                      <div className="flex items-center space-x-2 sm:space-x-4 text-xs">
                        <span className="text-gray-600">{product.total_quantity} sold</span>
                        <span className="font-semibold text-green-600 truncate">GHS {product.total_revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Alert */}
          {stats?.low_stock_details && stats.low_stock_details.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Low Stock Alert</h2>
                  <p className="text-sm text-gray-600">Items need restocking</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div className="space-y-4">
                {stats.low_stock_details.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition cursor-pointer border-l-4 border-red-500"
                    onClick={() => navigate('/admin/products')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.image_urls && product.image_urls[0] ? (
                          <img
                            src={product.image_urls[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        product.stock_quantity === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {product.stock_quantity === 0 ? 'Out of Stock' : `${product.stock_quantity} left`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/admin/products')}
                className="w-full mt-4 btn btn-primary btn-sm"
              >
                Manage Inventory
              </button>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        {stats?.recent_orders && stats.recent_orders.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Recent Orders</h2>
                <p className="text-sm text-gray-600">Latest customer orders</p>
              </div>
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((order: any) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => navigate('/admin/orders')}
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono text-gray-900">#{order.id.slice(0, 8)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900">{order.shipping_address?.full_name || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-semibold text-gray-900">
                            GHS {parseFloat(order.total_amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="capitalize">{order.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => navigate('/admin/orders')}
              className="w-full mt-4 btn btn-secondary btn-sm"
            >
              View All Orders
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
