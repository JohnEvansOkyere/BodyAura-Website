// frontend/src/pages/HomePage.tsx

import { Link } from 'react-router-dom';
import { Star, Heart, ArrowRight, Package } from 'lucide-react';
import Navbar from '../components/Navbar';
import CategorySidebar from '../components/CategorySidebar';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import RecommendedProducts from '../components/RecommendedProducts';
import AllProducts from '../components/AllProducts';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Navbar />

      {/* Hero Section with Search - Sticky */}
      <section className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-4 sticky top-16 z-40 shadow-sm">
        <div className="container-custom">
          {/* Brand Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Grejoy China Market
              </span>
            </h1>
            <p className="text-sm text-gray-600">Quality • Affordable • Reliable</p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-4xl mx-auto mb-3">
            <EnhancedSearchBar />
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="text-gray-600">Popular:</span>
            {['Phones', 'Laptops', 'Fashion', 'Watches', 'Beauty'].map((item) => (
              <Link
                key={item}
                to={`/products?search=${item}`}
                className="text-red-600 hover:text-red-700 hover:underline"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-8 bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar Categories */}
            <aside className="hidden lg:block">
              <CategorySidebar />

              {/* Promo Banner */}
              <div className="mt-6 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg p-6 text-white">
                <Star className="w-10 h-10 mb-3" />
                <h3 className="font-bold text-lg mb-2">New Customer?</h3>
                <p className="text-sm mb-4 text-white/90">
                  Get exclusive deals on your first order!
                </p>
                {!isAuthenticated && (
                  <Link
                    to="/signup"
                    className="inline-block bg-white text-red-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition"
                  >
                    Sign Up Now
                  </Link>
                )}
              </div>
            </aside>

            {/* Main Products Area */}
            <main>
              {/* Recommended Products Section - Only for logged-in users */}
              {isAuthenticated && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Heart className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Recommended for You
                        </h2>
                        <p className="text-sm text-gray-600">
                          Based on your cart items
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/products"
                      className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <RecommendedProducts />
                </div>
              )}

              {/* All Products Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        All Products
                      </h2>
                      <p className="text-sm text-gray-600">
                        Browse our complete collection
                      </p>
                    </div>
                  </div>
                </div>

                <AllProducts />
              </div>

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '100% Authentic', desc: 'Genuine products' },
                  { label: 'Fast Delivery', desc: 'Nationwide shipping' },
                  { label: 'Secure Payment', desc: 'Mobile Money & Card' },
                  { label: '24/7 Support', desc: 'Always here to help' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-4 text-center shadow-sm"
                  >
                    <p className="font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Simple Footer CTA */}
      <section className="bg-gray-900 text-white py-12">
        <div className="container-custom text-center">
          <h3 className="text-3xl font-bold mb-4">
            Start Shopping Today
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers shopping authentic Chinese products in Ghana
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/products"
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-semibold hover:from-red-700 hover:to-orange-700 transition"
            >
              Browse Products
            </Link>
            {!isAuthenticated && (
              <Link
                to="/signup"
                className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
