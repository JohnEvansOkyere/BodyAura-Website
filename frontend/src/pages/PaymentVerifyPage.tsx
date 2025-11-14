// frontend/src/pages/PaymentVerifyPage.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import Navbar from '../components/Navbar';

export default function PaymentVerifyPage() {
  const { reference } = useParams<{ reference: string }>();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  // Verify payment mutation
  const verifyMutation = useMutation({
    mutationFn: () => paymentService.verifyPayment(reference!),
    onSuccess: (data) => {
      setVerificationStatus('success');
      // Redirect to order page after 3 seconds
      setTimeout(() => {
        navigate(`/orders/${data.order_id}`);
      }, 3000);
    },
    onError: () => {
      setVerificationStatus('failed');
    },
  });

  useEffect(() => {
    if (reference) {
      verifyMutation.mutate();
    }
  }, [reference]);

  return (
    <>
      <Navbar />
      
      <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12">
        <div className="container-custom max-w-md">
          <div className="card text-center py-12">
            {verificationStatus === 'verifying' && (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                <p className="text-gray-600">Please wait while we confirm your payment...</p>
              </>
            )}

            {verificationStatus === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your payment has been confirmed. Your order is being processed.
                </p>
                <div className="animate-pulse text-sm text-gray-500">
                  Redirecting to your order...
                </div>
              </>
            )}

            {verificationStatus === 'failed' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                <p className="text-gray-600 mb-6">
                  We couldn't verify your payment. Please try again or contact support.
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  className="btn btn-primary btn-md"
                >
                  Back to Orders
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}