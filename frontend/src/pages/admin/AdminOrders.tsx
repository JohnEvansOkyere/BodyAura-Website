// frontend/src/pages/admin/AdminOrders.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye } from 'lucide-react';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/AdminLayout';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/OrderStatusBadge';
import OrderStatusModal from '../../components/OrderStatusModal';
import toast from 'react-hot-toast';
import { Order } from '../../types';

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminService.getAllOrders(0, 50),
  });

  // Filter orders by search
  const filteredOrders = ordersData?.orders?.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.shipping_address.full_name.toLowerCase().includes(searchLower) ||
      order.shipping_address.phone.includes(searchTerm)
    );
  });

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order ID, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="card">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-4 px-4 font-semibold">Customer</th>
                  <th className="text-left py-4 px-4 font-semibold">Date</th>
                  <th className="text-left py-4 px-4 font-semibold">Total</th>
                  <th className="text-left py-4 px-4 font-semibold">Status</th>
                  <th className="text-left py-4 px-4 font-semibold">Payment</th>
                  <th className="text-right py-4 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const totalPrice = typeof order.total_amount === 'string'
                    ? parseFloat(order.total_amount)
                    : order.total_amount;

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{order.shipping_address.full_name}</p>
                          <p className="text-sm text-gray-500">{order.shipping_address.phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-semibold">
                        GHS {totalPrice.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-4">
                        <PaymentStatusBadge status={order.payment_status} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-16">
            <p className="text-gray-600">No orders found</p>
          </div>
        )}
      </div>

      {/* Order Status Modal */}
      {selectedOrder && (
        <OrderStatusModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setSelectedOrder(null);
          }}
        />
      )}
    </AdminLayout>
  );
}