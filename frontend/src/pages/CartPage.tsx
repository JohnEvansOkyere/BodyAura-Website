// frontend/src/pages/CartPage.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { cartService } from '../services/cartService';
import Navbar from '../components/Navbar';
import CartItemCard from '../components/CartItemCard';
import CartSummary from '../components/CartSummary';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCartCount } = useCartStore();

  // Fetch cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
  });

  // Update cart item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart updated');
    },
    onError: () => {
      toast.error('Failed to update cart');
    },
  });

  // Remove cart item mutation
  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeCartItem(itemId),
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      // Update cart count
      if (cart) {
        const removedItem = cart.items.find(item => item.id === itemId);
        if (removedItem) {
          setCartCount(cart.total_items - removedItem.quantity);
        }
      }
      
      toast.success('Item removed from cart');
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setCartCount(0);
      toast.success('Cart cleared');
    },
    onError: () => {
      toast.error('Failed to clear cart');
    },
  });

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateItemMutation.mutate({ itemId, quantity });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  const handleCheckout = () => {
    // Navigate to checkout page (will be built in Phase 12)
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCartMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container-custom py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <>
      <Navbar />
      
      <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-0">
            <div className="w-full sm:w-auto">
              <button
                onClick={() => navigate('/products')}
                className="flex items-center text-gray-600 hover:text-primary-600 mb-2 transition text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Continue Shopping
              </button>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Shopping Cart</h1>
              {!isEmpty && (
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                  {cart.total_items} {cart.total_items === 1 ? 'item' : 'items'} in your cart
                </p>
              )}
            </div>

            {!isEmpty && (
              <button
                onClick={handleClearCart}
                disabled={clearCartMutation.isPending}
                className="btn btn-outline btn-sm text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto text-sm"
              >
                Clear Cart
              </button>
            )}
          </div>

          {isEmpty ? (
            /* Empty Cart State */
            <div className="card text-center py-12 sm:py-16">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 px-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                Start adding some products to your cart
              </p>
              <button
                onClick={() => navigate('/products')}
                className="btn btn-primary btn-md sm:btn-lg"
              >
                Browse Products
              </button>
            </div>
          ) : (
            /* Cart with Items */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={updateItemMutation.isPending || removeItemMutation.isPending}
                  />
                ))}
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <CartSummary
                  totalItems={cart.total_items}
                  totalPrice={cart.total_price}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}