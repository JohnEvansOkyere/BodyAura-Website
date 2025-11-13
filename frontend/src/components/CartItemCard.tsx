// frontend/src/components/CartItemCard.tsx

import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '../types';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating: boolean;
}

export default function CartItemCard({ item, onUpdateQuantity, onRemove, isUpdating }: CartItemCardProps) {
  const { product, quantity } = item;
  
  // FIX: Convert price to number
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const itemTotal = price * quantity;

  const imageUrl = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[0]
    : 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200';

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > product.stock_quantity) {
      return;
    }
    onUpdateQuantity(item.id, newQuantity);
  };

  return (
    <div className="card flex flex-col md:flex-row gap-4">
      {/* Product Image */}
      <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            {product.category && (
              <p className="text-sm text-gray-500">{product.category}</p>
            )}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isUpdating}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Remove from cart"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Price */}
        <p className="text-primary-600 font-semibold mb-3">
          GHS {price.toFixed(2)} each
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                handleQuantityChange(val);
              }}
              disabled={isUpdating}
              className="w-16 text-center border border-gray-300 rounded-lg py-1.5 text-sm"
              min="1"
              max={product.stock_quantity}
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating || quantity >= product.stock_quantity}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 ml-2">
              Max: {product.stock_quantity}
            </span>
          </div>

          {/* Item Total */}
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              GHS {itemTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Low stock warning */}
        {product.stock_quantity < 5 && (
          <p className="text-sm text-orange-600 mt-2">
            Only {product.stock_quantity} left in stock!
          </p>
        )}
      </div>
    </div>
  );
}