// frontend/src/hooks/usePaystack.ts

import { useState } from 'react';

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  callback: (response: any) => void;
  onClose: () => void;
}

export const usePaystack = () => {
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = (config: PaystackConfig) => {
    setIsLoading(true);

    // Load Paystack inline script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore - PaystackPop is loaded from external script
      const handler = window.PaystackPop.setup({
        key: config.key,
        email: config.email,
        amount: config.amount, // Amount in kobo (pesewas)
        ref: config.ref,
        callback: (response: any) => {
          setIsLoading(false);
          config.callback(response);
        },
        onClose: () => {
          setIsLoading(false);
          config.onClose();
        },
      });

      handler.openIframe();
    };

    script.onerror = () => {
      setIsLoading(false);
      console.error('Failed to load Paystack script');
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  };

  return { initializePayment, isLoading };
};