// frontend/src/components/CategorySidebar.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Electronics & Gadgets',
    icon: Smartphone,
    subcategories: ['Smartphones', 'Laptops', 'Tablets', 'Smart Watches', 'Headphones', 'Cameras'],
  },
  {
    name: 'Fashion & Accessories',
    icon: Shirt,
    subcategories: ['Men Fashion', 'Women Fashion', 'Kids Fashion', 'Shoes', 'Sunglasses', 'Belts'],
  },
  {
    name: 'Home & Living',
    icon: Home,
    subcategories: ['Furniture', 'Decor', 'Bedding', 'Storage', 'Lighting', 'Garden'],
  },
  {
    name: 'Toys & Games',
    icon: Gamepad2,
    subcategories: ['Action Figures', 'Educational Toys', 'Board Games', 'Outdoor Toys', 'Puzzles'],
  },
  {
    name: 'Beauty & Cosmetics',
    icon: Sparkles,
    subcategories: ['Makeup', 'Skincare', 'Hair Care', 'Perfumes', 'Beauty Tools', 'Nail Care'],
  },
  {
    name: 'Sports & Fitness',
    icon: Dumbbell,
    subcategories: ['Gym Equipment', 'Sportswear', 'Yoga', 'Cycling', 'Swimming', 'Running'],
  },
  {
    name: 'Kitchen & Dining',
    icon: UtensilsCrossed,
    subcategories: ['Cookware', 'Utensils', 'Appliances', 'Storage', 'Tableware', 'Bakeware'],
  },
  {
    name: 'Phone Accessories',
    icon: PhoneCall,
    subcategories: ['Cases', 'Screen Protectors', 'Chargers', 'Cables', 'Power Banks', 'Holders'],
  },
  {
    name: 'Bags & Luggage',
    icon: Briefcase,
    subcategories: ['Backpacks', 'Handbags', 'Travel Bags', 'Wallets', 'School Bags', 'Laptop Bags'],
  },
  {
    name: 'Watches & Jewelry',
    icon: Watch,
    subcategories: ['Watches', 'Necklaces', 'Bracelets', 'Rings', 'Earrings', 'Jewelry Sets'],
  },
];

export default function CategorySidebar() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-3 font-semibold">
        All Categories
      </div>

      <div className="relative">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isHovered = hoveredCategory === category.name;

          return (
            <div
              key={category.name}
              className="relative"
              onMouseEnter={() => setHoveredCategory(category.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Link
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-orange-50 border-b border-gray-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                    {category.name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
              </Link>

              {/* Subcategory Dropdown */}
              {isHovered && (
                <div className="absolute left-full top-0 ml-0 w-64 bg-white shadow-xl border border-gray-200 rounded-r-lg z-50">
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {category.subcategories.map((sub) => (
                        <Link
                          key={sub}
                          to={`/products?category=${encodeURIComponent(category.name)}&search=${encodeURIComponent(sub)}`}
                          className="text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
