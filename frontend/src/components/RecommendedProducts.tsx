// frontend/src/components/RecommendedProducts.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { productService } from '../services/productService';
import ProductCard from './ProductCard';
import ProductDetailsModal from './ProductDetailsModal';
import { useAuthStore } from '../store/authStore';
import { Product } from '../types';

export default function RecommendedProducts() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Fetch personalized recommendations using the new smart API
  const { data: products, isLoading } = useQuery({
    queryKey: ['personalized-recommendations'],
    queryFn: () => productService.getPersonalizedRecommendations(8),
    enabled: isAuthenticated, // Only fetch if user is authenticated
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" />
      </div>
    );
  }

  if (!products || products.length === 0) {
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
