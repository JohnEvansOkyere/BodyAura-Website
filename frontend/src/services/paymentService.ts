// frontend/src/services/paymentService.ts

import api from './api';

interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface VerifyPaymentResponse {
  status: string;
  message: string;
  reference: string;
  amount: number;
  order_id: string;
}

export const paymentService = {
  /**
   * Initialize payment with Paystack
   */
  initializePayment: async (orderId: string): Promise<InitializePaymentResponse> => {
    const response = await api.post<InitializePaymentResponse>(
      `/api/payments/initialize/${orderId}`
    );
    return response.data;
  },

  /**
   * Verify payment
   */
  verifyPayment: async (reference: string): Promise<VerifyPaymentResponse> => {
    const response = await api.get<VerifyPaymentResponse>(
      `/api/payments/verify/${reference}`
    );
    return response.data;
  },
};