// frontend/src/components/RecommendedProducts.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import ProductCard from './ProductCard';
import ProductDetailsModal from './ProductDetailsModal';
import { useAuthStore } from '../store/authStore';
import { Product } from '../types';

export default function RecommendedProducts() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Fetch user's cart to get categories
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  // Extract categories from cart items
  const cartCategories = cart?.items
    ?.map(item => item.product.category)
    .filter((category, index, self) => category && self.indexOf(category) === index) || [];

  // Fetch recommended products based on cart categories
  const { data: recommendedData, isLoading } = useQuery({
    queryKey: ['recommended-products', cartCategories],
    queryFn: async () => {
      // If user has cart items, recommend from same categories
      if (cartCategories.length > 0) {
        const category = cartCategories[0]; // Use first category
        return productService.getProducts({
          category,
          limit: 8,
        });
      }

      // Fallback: show trending products
      return productService.getProducts({
        sort_by: 'trending_score',
        sort_order: 'desc',
        limit: 8,
      });
    },
  });

  const products = recommendedData?.products || [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <ProductCard
              product={product}
              onAddToCart={() => {}}
              onViewDetails={() => setSelectedProduct(product)}
            />
          </motion.div>
        ))}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
