// frontend/src/components/ProductDetailModal.tsx

import { X, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import { useState } from 'react';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // FIX: Convert price to number
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

  const images = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : ['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800'];

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Images */}
              <div>
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                          idx === currentImageIndex
                            ? 'border-primary-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                {/* Category */}
                {product.category && (
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                    {product.category}
                  </span>
                )}

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary-600">
                    GHS {price.toFixed(2)}
                  </span>
                </div>

                {/* Stock Status */}
                <div className="mb-6">
                  {product.stock_quantity > 10 && (
                    <span className="badge badge-success">In Stock</span>
                  )}
                  {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                    <span className="badge badge-warning">
                      Only {product.stock_quantity} left
                    </span>
                  )}
                  {product.stock_quantity === 0 && (
                    <span className="badge badge-danger">Out of Stock</span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description || 'No description available.'}
                  </p>
                </div>

                {/* Quantity Selector */}
                {product.stock_quantity > 0 && (
                  <div className="mb-6">
                    <label className="block font-semibold mb-2">Quantity</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setQuantity(Math.min(Math.max(1, val), product.stock_quantity));
                        }}
                        className="w-20 text-center border border-gray-300 rounded-lg py-2"
                        min="1"
                        max={product.stock_quantity}
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-500">
                        Max: {product.stock_quantity}
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className="btn btn-primary btn-lg w-full"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}