// frontend/src/pages/ProductsPage.tsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { Product } from '../types';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { incrementCart } = useCartStore();
  const [searchParams] = useSearchParams();

  // Read URL parameters and set initial state
  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Update state when URL parameters change
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    setSelectedCategory(category);
    setSearchTerm(search);
  }, [searchParams]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory, minPrice, maxPrice],
    queryFn: () => productService.getProducts({
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined,
      limit: 50,
    }),
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      incrementCart();
      toast.success('Added to cart!');
    },
    onError: () => {
      toast.error('Failed to add to cart');
    },
  });

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCartMutation.mutate({ productId: product.id, quantity });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = searchTerm || selectedCategory || minPrice || maxPrice;

  return (
    <>
      <Navbar />
      
      <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Products</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Discover our collection of health and wellness products
            </p>
          </div>

          <div className="flex gap-4 sm:gap-6">
            {/* Category Sidebar */}
            <div className={`transition-all duration-300 ${showSidebar ? 'w-full sm:w-64' : 'w-0'} flex-shrink-0 ${showSidebar ? 'fixed sm:static inset-0 z-40 sm:z-0 bg-black/50 sm:bg-transparent' : ''}`}>
              {showSidebar && (
                <>
                  {/* Mobile backdrop */}
                  <div 
                    className="sm:hidden absolute inset-0" 
                    onClick={() => setShowSidebar(false)}
                  />
                  
                  {/* Sidebar content */}
                  <div className="bg-white rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 p-4 h-full sm:h-auto overflow-y-auto sm:sticky sm:top-24 relative sm:relative max-w-xs sm:max-w-none mx-auto sm:mx-0 mt-16 sm:mt-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Categories</h3>
                      <button
                        onClick={() => setShowSidebar(false)}
                        className="p-1 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation"
                        title="Hide categories"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setShowSidebar(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm sm:text-base touch-manipulation ${
                        selectedCategory === ''
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                      }`}
                    >
                      All Products
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowSidebar(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm sm:text-base touch-manipulation ${
                          selectedCategory === cat
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar Toggle Button (when hidden) */}
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 bg-white shadow-lg border border-gray-200 rounded-lg sm:rounded-r-lg p-2 sm:p-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                title="Show categories"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Search and Filter Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9 sm:pl-10 w-full text-sm sm:text-base"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline btn-md w-full sm:w-auto touch-manipulation text-sm sm:text-base"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="sm:hidden">{showFilters ? 'Hide' : 'Show'} Filters</span>
                <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input text-sm sm:text-base"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium mb-2">Min Price (GHS)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="input text-sm sm:text-base"
                    min="0"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium mb-2">Max Price (GHS)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="input text-sm sm:text-base"
                    min="0"
                  />
                </div>
              </div>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="badge badge-info">
                    Search: {searchTerm}
                  </span>
                )}
                {selectedCategory && (
                  <span className="badge badge-info">
                    Category: {selectedCategory}
                  </span>
                )}
                {minPrice && (
                  <span className="badge badge-info">
                    Min: GHS {minPrice}
                  </span>
                )}
                {maxPrice && (
                  <span className="badge badge-info">
                    Max: GHS {maxPrice}
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-3 sm:p-4 md:p-6 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3 sm:mb-4"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : productsData && productsData.products.length > 0 ? (
            <>
              <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                Showing {productsData.products.length} of {productsData.total} products
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {productsData.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={setSelectedProduct}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 sm:py-16 md:py-20 px-4">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-primary btn-md touch-manipulation">
                  Clear Filters
                </button>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}