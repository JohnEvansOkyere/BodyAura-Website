// frontend/src/types/paystack.d.ts

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  callback: (response: any) => void;
  onClose: () => void;
}

interface PaystackPop {
  setup: (options: PaystackOptions) => {
    openIframe: () => void;
  };
}

interface Window {
  PaystackPop: PaystackPop;
}