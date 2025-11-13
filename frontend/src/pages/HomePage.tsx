// frontend/src/pages/HomePage.tsx

import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Shield, Truck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Your Health, Our Priority
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Discover premium health and wellness products delivered right to your doorstep in Ghana.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Shop Now
              </Link>
              {!isAuthenticated && (
                <Link to="/signup" className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Grejoy?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">
                Carefully selected health and wellness products from trusted brands.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick and reliable delivery across Ghana with tracking.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">
                Pay safely with Mobile Money or card through Paystack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our collection of health products and take the first step towards a healthier lifestyle.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Explore Products
          </Link>
        </div>
      </section>
    </>
  );
}