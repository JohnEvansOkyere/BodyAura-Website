// frontend/src/components/TrendingProducts.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { productService } from '../services/productService';
import ProductCard from './ProductCard';
import ProductDetailsModal from './ProductDetailsModal';
import { Product } from '../types';

export default function TrendingProducts() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch trending products (sorted by created_at - newest first)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: () => productService.getProducts({
      sort_by: 'created_at',
      sort_order: 'desc',
      limit: 12,
    }),
  });

  const products = productsData?.products || [];

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
      <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
