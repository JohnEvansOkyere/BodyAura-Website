// frontend/src/components/ProductCard.tsx

import { Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const imageUrl = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[0]
    : 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500';

  // FIX: Convert price to number
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

  const handleClick = () => {
    console.log('ProductCard clicked:', product.name);
    onViewDetails(product);
  };

  return (
    <div
      className="card card-hover cursor-pointer group h-full flex flex-col"
      onClick={handleClick}
    >
      {/* Image - Fixed height */}
      <div className="relative w-full h-48 overflow-hidden rounded-lg mb-4 flex-shrink-0">
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

        {/* View Details Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white rounded-full p-3">
              <Eye className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content - Flex grow to fill space */}
      <div className="flex flex-col flex-grow">
        <h3 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-red-600 transition min-h-[3rem]">
          {product.name}
        </h3>

        {product.category && (
          <p className="text-xs text-gray-500 mb-2">{product.category}</p>
        )}

        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-red-600">
            GHS {price.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500 group-hover:text-red-600 transition">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
}