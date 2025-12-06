// frontend/src/components/CartSummary.tsx
import { ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number | string;
  cartItems?: CartItem[];
  onCheckout: () => void;
  isCheckingOut?: boolean;
}

export default function CartSummary({
  totalItems,
  totalPrice,
  cartItems = [],
  onCheckout,
  isCheckingOut
}: CartSummaryProps) {
  // Safely convert totalPrice to number (handles string, undefined, null)
  const safeTotalPrice = typeof totalPrice === 'number'
    ? totalPrice
    : parseFloat(totalPrice as string) || 0;

  // Early return if total is invalid (optional: for debugging/error state)
  if (isNaN(safeTotalPrice) || safeTotalPrice < 0) {
    console.error('Invalid totalPrice received:', totalPrice);
    return (
      <div className="card sticky top-24 p-4 text-center text-red-600">
        <p>Error loading cart summary. Please refresh the page.</p>
      </div>
    );
  }

  // Calculate delivery cost from cart items
  const delivery: number = cartItems.reduce((total, item) => {
    const itemDelivery = item.product.shipping_cost || 0;
    return total + (itemDelivery * item.quantity);
  }, 0);

  const tax = safeTotalPrice * 0.0; // No tax for now
  const finalTotal = safeTotalPrice + delivery + tax;

  return (
    <div className="card sticky top-24">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      {/* Items Count */}
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between text-gray-600">
          <span>Items ({totalItems})</span>
          <span>GHS {safeTotalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span className={delivery === 0 ? "text-green-600 font-medium" : "text-gray-900 font-medium"}>
            {delivery === 0 ? 'FREE' : `GHS ${delivery.toFixed(2)}`}
          </span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>GHS {tax.toFixed(2)}</span>
          </div>
        )}
      </div>
      {/* Total */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-2xl font-bold text-primary-600">
          GHS {finalTotal.toFixed(2)}
        </span>
      </div>
      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={isCheckingOut || totalItems === 0}
        className="btn btn-primary btn-lg w-full"
      >
        <ShoppingBag className="w-5 h-5 mr-2" />
        {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
      </button>
      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          {delivery === 0 ? (
            <><strong>Free Delivery</strong> on all orders within Ghana!</>
          ) : (
            <>Delivery costs calculated based on your items</>
          )}
        </p>
      </div>
    </div>
  );
}
