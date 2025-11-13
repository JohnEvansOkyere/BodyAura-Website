// frontend/src/pages/OrderDetailPage.tsx

import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { orderService } from '../services/orderService';
import Navbar from '../components/Navbar';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatusBadge';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId!),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container-custom py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="container-custom py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <button onClick={() => navigate('/orders')} className="btn btn-primary btn-md">
            Back to Orders
          </button>
        </div>
      </>
    );
  }

  const totalPrice = typeof order.total_amount === 'string'
    ? parseFloat(order.total_amount)
    : order.total_amount;

  return (
    <>
      <Navbar />
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center text-gray-600 hover:text-primary-600 mb-2 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Orders
            </button>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Order #{order.id.slice(0, 8)}</h1>
                <p className="text-gray-600">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.payment_status} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items Card */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Items
                </h2>
                <div className="space-y-4">
                  {order.items && order.items.map((item) => {
                    const price = typeof item.price_at_time === 'string'
                      ? parseFloat(item.price_at_time)
                      : item.price_at_time;
                    const itemTotal = price * item.quantity;

                    const imageUrl = item.product?.image_urls?.[0] || 
                      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200';

                    return (
                      <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0">
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product?.name || 'Product'}</h3>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Price: GHS {price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">GHS {itemTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </h2>
                <div className="text-gray-700 space-y-1">
                  <p className="font-semibold">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.phone}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>{order.shipping_address.city}, {order.shipping_address.region}</p>
                  {order.shipping_address.postal_code && (
                    <p>{order.shipping_address.postal_code}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Information
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {order.payment_method.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {order.payment_reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-sm">{order.payment_reference}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>GHS {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    GHS {totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* Order Status Timeline */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold mb-3">Order Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'processing' ? 'bg-blue-500' : order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>Processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'shipped' ? 'bg-blue-500' : order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>Shipped</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}