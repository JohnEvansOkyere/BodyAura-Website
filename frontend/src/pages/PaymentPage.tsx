// frontend/src/pages/PaymentPage.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, CreditCard, Smartphone, AlertCircle } from 'lucide-react';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { usePaystack } from '../hooks/usePaystack';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { initializePayment, isLoading: isPaystackLoading } = usePaystack();
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId!),
    enabled: !!orderId,
  });

  // Initialize payment mutation
  const initializePaymentMutation = useMutation({
    mutationFn: () => paymentService.initializePayment(orderId!),
    onSuccess: (data) => {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      
      if (!publicKey) {
        toast.error('Payment configuration error. Please contact support.');
        return;
      }

      // Convert GHS to pesewas (multiply by 100)
      const totalPrice = typeof order!.total_amount === 'string'
        ? parseFloat(order!.total_amount)
        : order!.total_amount;
      
      const amountInPesewas = Math.round(totalPrice * 100);

      // Initialize Paystack popup
      initializePayment({
        key: publicKey,
        email: user!.email,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: data.reference,
        callback: (response) => {
          // Payment successful
          navigate(`/payment/verify/${response.reference}`);
        },
        onClose: () => {
          toast.error('Payment cancelled');
          setIsInitializing(false);
        },
      });
    },
    onError: () => {
      toast.error('Failed to initialize payment');
      setIsInitializing(false);
    },
  });

  const handlePayNow = () => {
    setIsInitializing(true);
    initializePaymentMutation.mutate();
  };

  if (isLoadingOrder) {
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

  // Check if already paid
  if (order.payment_status === 'completed') {
    navigate(`/orders/${orderId}`);
    return null;
  }

  const totalPrice = typeof order.total_amount === 'string'
    ? parseFloat(order.total_amount)
    : order.total_amount;

  return (
    <>
      <Navbar />
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Complete Payment</h1>
            <p className="text-gray-600">Order #{order.id.slice(0, 8)}</p>
          </div>

          {/* Payment Card */}
          <div className="card">
            {/* Order Summary */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">GHS {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-primary-600">GHS {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Info */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {order.payment_method.includes('momo') ? (
                    <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">
                      {order.payment_method.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-blue-700">
                      You will be redirected to complete your payment securely via Paystack
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Do not close the payment window during transaction</li>
                    <li>You will receive a confirmation once payment is successful</li>
                    <li>Your order will be processed immediately after payment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pay Now Button */}
            <button
              onClick={handlePayNow}
              disabled={isInitializing || isPaystackLoading}
              className="btn btn-primary btn-lg w-full"
            >
              {isInitializing || isPaystackLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay GHS {totalPrice.toFixed(2)}
                </>
              )}
            </button>

            {/* Cancel */}
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="btn btn-outline btn-md w-full mt-3"
              disabled={isInitializing || isPaystackLoading}
            >
              Cancel
            </button>
          </div>

          {/* Security Badge */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              🔒 Secured by Paystack • Your payment information is encrypted
            </p>
          </div>
        </div>
      </div>
    </>
  );
}