// frontend/src/pages/OrdersPage.tsx

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, Eye } from 'lucide-react';
import { orderService } from '../services/orderService';
import Navbar from '../components/Navbar';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatusBadge';

export default function OrdersPage() {
  const navigate = useNavigate();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getOrders(),
  });

  return (
    <>
      <Navbar />
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : ordersData && ordersData.orders.length > 0 ? (
            <div className="space-y-4">
              {ordersData.orders.map((order) => {
                const totalPrice = typeof order.total_amount === 'string'
                  ? parseFloat(order.total_amount)
                  : order.total_amount;

                return (
                  <div 
                    key={order.id} 
                    className="card hover:shadow-md transition cursor-pointer" 
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            <OrderStatusBadge status={order.status} />
                            <PaymentStatusBadge status={order.payment_status} />
                          </div>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Payment: {order.payment_method.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Order Total & Action */}
                      <div className="flex items-center justify-between md:justify-end space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-primary-600">
                            GHS {totalPrice.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${order.id}`);
                          }}
                          className="btn btn-outline btn-md"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">
                Start shopping and your orders will appear here
              </p>
              <button
                onClick={() => navigate('/products')}
                className="btn btn-primary btn-lg"
              >
                Browse Products
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}