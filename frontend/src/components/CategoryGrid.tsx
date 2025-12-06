// frontend/src/components/CategoryGrid.tsx

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Smartphone,
  Shirt,
  Home,
  Gamepad2,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  PhoneCall,
  Briefcase,
  Watch,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';

// Category configuration with icons and colors
const CATEGORIES = [
  {
    name: 'Electronics & Gadgets',
    icon: Smartphone,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    name: 'Fashion & Accessories',
    icon: Shirt,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  {
    name: 'Home & Living',
    icon: Home,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    name: 'Toys & Games',
    icon: Gamepad2,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
  },
  {
    name: 'Beauty & Cosmetics',
    icon: Sparkles,
    color: 'from-pink-400 to-purple-400',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  {
    name: 'Sports & Fitness',
    icon: Dumbbell,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    name: 'Kitchen & Dining',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    name: 'Phone Accessories',
    icon: PhoneCall,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
  },
  {
    name: 'Bags & Luggage',
    icon: Briefcase,
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
  },
  {
    name: 'Watches & Jewelry',
    icon: Watch,
    color: 'from-amber-500 to-yellow-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
];

export default function CategoryGrid() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  // Fetch category counts
  const { data: categoryCounts } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const category of CATEGORIES) {
        const result = await productService.getProducts({ category: category.name, limit: 1 });
        counts[category.name] = result.total || 0;
      }
      return counts;
    },
  });

  return (
    <section ref={ref} className="py-16 bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Shop by{' '}
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Category
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Discover quality products imported directly from China
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {CATEGORIES.map((category, idx) => {
            const Icon = category.icon;
            const count = categoryCounts?.[category.name] || 0;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group block"
                >
                  <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-primary-500 hover:shadow-lg transition-all duration-300">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${category.bgColor} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${category.textColor}`} />
                    </div>

                    {/* Category Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>

                    {/* Product Count */}
                    <p className="text-sm text-gray-500">
                      {count > 0 ? `${count}+ Products` : 'Coming Soon'}
                    </p>

                    {/* Arrow Icon on Hover */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
