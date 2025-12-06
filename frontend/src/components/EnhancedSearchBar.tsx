// frontend/src/components/EnhancedSearchBar.tsx

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CHINA_CATEGORIES = [
  'Electronics & Gadgets',
  'Fashion & Accessories',
  'Home & Living',
  'Toys & Games',
  'Beauty & Cosmetics',
  'Sports & Fitness',
  'Kitchen & Dining',
  'Phone Accessories',
  'Bags & Luggage',
  'Watches & Jewelry',
];

export default function EnhancedSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedCategory !== 'All Categories') params.append('category', selectedCategory);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white border-2 border-red-600 rounded-full overflow-hidden shadow-lg">
      <form onSubmit={handleSearch} className="flex items-center">
        {/* Category Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="px-6 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-200 whitespace-nowrap min-w-[180px] text-left"
          >
            {selectedCategory}
          </button>

          {showCategoryDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowCategoryDropdown(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCategory('All Categories');
                    setShowCategoryDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 font-medium"
                >
                  All Categories
                </button>
                {CHINA_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for products..."
          className="flex-1 px-6 py-4 text-base outline-none"
        />

        {/* Search Button */}
        <button
          type="submit"
          className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold hover:from-red-700 hover:to-orange-700 transition-all flex items-center space-x-2"
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>
      </form>
    </div>
  );
}
