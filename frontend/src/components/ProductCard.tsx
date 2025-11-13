// frontend/src/components/ProductCard.tsx

import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const imageUrl = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[0]
    : 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500';

  // FIX: Convert price to number
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

  return (
    <div className="card card-hover cursor-pointer group">
      {/* Image */}
      <div 
        className="relative aspect-square overflow-hidden rounded-lg mb-4"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-warning">Low Stock</span>
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-danger">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div onClick={() => onViewDetails(product)}>
        <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary-600 transition">
          {product.name}
        </h3>
        
        {product.category && (
          <p className="text-sm text-gray-500 mb-2">{product.category}</p>
        )}

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            GHS {price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart(product);
        }}
        disabled={product.stock_quantity === 0}
        className="btn btn-primary btn-md w-full mt-4"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </button>
    </div>
  );
}