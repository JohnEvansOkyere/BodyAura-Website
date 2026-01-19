// frontend/src/components/ProductDetailsModal.tsx

import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Heart, Share2, Star, Package, Truck } from 'lucide-react';
import { Product } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cartService';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  console.log('ProductDetailsModal rendered with product:', product.name);

  // Track product view when modal opens
  useEffect(() => {
    productService.trackProductView(product.id, 'modal');
  }, [product.id]);

  const addToCartMutation = useMutation({
    mutationFn: (quantity: number) => cartService.addToCart(product.id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to add to cart');
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (quantity > product.stock_quantity) {
      toast.error('Not enough stock available');
      return;
    }

    addToCartMutation.mutate(quantity);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to make a purchase');
      navigate('/login');
      return;
    }

    if (quantity > product.stock_quantity) {
      toast.error('Not enough stock available');
      return;
    }

    // Add to cart first
    try {
      await cartService.addToCart(product.id, quantity);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Proceeding to checkout...');
      onClose();
      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const images = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : ['https://via.placeholder.com/600x600?text=No+Image'];

  const totalPrice = typeof product.price === 'string'
    ? parseFloat(product.price) * quantity
    : product.price * quantity;

  const deliveryCost = typeof product.shipping_cost === 'string'
    ? parseFloat(product.shipping_cost) || 0
    : product.shipping_cost || 0;

  const grandTotal = totalPrice + deliveryCost;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center overflow-y-auto p-0 sm:p-4" style={{ position: 'fixed', backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
      {/* Backdrop - Fully opaque */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ position: 'absolute', backgroundColor: '#1a1a1a' }}
      />

      {/* Modal */}
      <div className="relative bg-white sm:rounded-lg max-w-6xl w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto shadow-2xl" style={{ position: 'relative', zIndex: 10 }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="sticky top-2 right-2 sm:absolute sm:top-4 sm:right-4 z-10 p-2 sm:p-2.5 bg-white rounded-full shadow-lg hover:bg-gray-100 transition ml-auto mr-2 mt-2 sm:m-0 flex items-center justify-center"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 pt-0 sm:pt-6 md:pt-8">
            {/* Left: Images */}
            <div>
              {/* Main Image */}
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-3 sm:mb-4">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-64 sm:h-80 md:h-96 object-cover"
                />
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {images.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`border-2 rounded-lg overflow-hidden touch-manipulation ${
                        selectedImage === idx ? 'border-red-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-16 sm:h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Video */}
              {product.video_url && (
                <div className="mt-3 sm:mt-4">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Product Video</h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    {product.video_url.includes('youtube.com') || product.video_url.includes('youtu.be') ? (
                      <iframe
                        width="100%"
                        height="250"
                        src={product.video_url.replace('watch?v=', 'embed/')}
                        title="Product Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg sm:h-[300px]"
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-auto rounded-lg"
                        src={product.video_url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div>
              {/* Category Badge */}
              {product.category && (
                <span className="inline-block bg-red-100 text-red-600 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1 rounded-full mb-2 sm:mb-3">
                  {product.category}
                </span>
              )}

              {/* Product Name */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Rating & Reviews (placeholder) */}
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-600">(4.0 stars)</span>
              </div>

              {/* Price */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600">
                    GHS {typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">per item</span>
                </div>
                {deliveryCost > 0 && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    + GHS {deliveryCost.toFixed(2)} delivery
                  </p>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-4 sm:mb-6 space-y-2">
                <div className="flex items-center space-x-2 text-sm sm:text-base">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                  <span className="font-semibold">Stock:</span>
                  <span className={`${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'} text-sm sm:text-base`}>
                    {product.stock_quantity > 0
                      ? `${product.stock_quantity} units available`
                      : 'Out of stock'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm sm:text-base">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                  <span className="font-semibold">Delivery:</span>
                  <span className="text-gray-600 text-sm sm:text-base">
                    {deliveryCost === 0 ? 'Free delivery' : 'Calculated at checkout'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-base sm:text-lg mb-2">Product Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-4 sm:mb-6">
                <label className="block font-semibold mb-2 text-sm sm:text-base">Quantity</label>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex items-center border-2 border-gray-300 rounded-lg touch-manipulation">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-2 sm:p-3 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="px-4 sm:px-6 font-semibold text-base sm:text-lg min-w-[3rem] text-center">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock_quantity}
                      className="p-2 sm:p-3 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <span className="text-gray-600 text-xs sm:text-sm">
                    {product.stock_quantity} available
                  </span>
                </div>
              </div>

              {/* Total Price */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                  <span className="text-gray-700">Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'}):</span>
                  <span className="font-semibold">GHS {totalPrice.toFixed(2)}</span>
                </div>
                {deliveryCost > 0 && (
                  <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
                    <span className="text-gray-700">Delivery:</span>
                    <span className="font-semibold">GHS {deliveryCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-red-600">
                    GHS {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 sm:space-y-3">
                {/* Buy Now Button - Primary Action */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock_quantity === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg touch-manipulation text-sm sm:text-base"
                >
                  <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Buy Now</span>
                </button>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 sm:py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-red-700 hover:to-orange-700 active:from-red-800 active:to-orange-800 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>
                    {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button className="border-2 border-gray-300 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:border-red-600 hover:text-red-600 active:bg-red-50 transition touch-manipulation text-sm sm:text-base">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Wishlist</span>
                  </button>
                  <button className="border-2 border-gray-300 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:border-red-600 hover:text-red-600 active:bg-red-50 transition touch-manipulation text-sm sm:text-base">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 text-center mt-2 px-2">
                  💡 <strong>Buy Now</strong> for instant checkout or <strong>Add to Cart</strong> to continue shopping
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: '100% Authentic', icon: '✓' },
                  { label: 'Secure Payment', icon: '🔒' },
                  { label: 'Fast Delivery', icon: '🚚' },
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center"
                  >
                    <span className="text-xl sm:text-2xl mb-0.5 sm:mb-1 block">{badge.icon}</span>
                    <p className="text-xs font-semibold text-gray-700 leading-tight">{badge.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
