// frontend/src/pages/CheckoutPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';

interface CheckoutFormData {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  region: string;
  postal_code?: string;
  payment_method: 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card';
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCartCount } = useCartStore();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('momo_mtn');
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    defaultValues: {
      payment_method: 'momo_mtn',
    },
  });

  // Fetch cart
  const { data: cart, isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
  });

  // Safe parsing for cart total_price (handles string/undefined/null)
  const safeTotalPrice = (price: number | string | undefined | null): number => {
    if (price === undefined || price === null) return 0;
    const parsed = typeof price === 'number' ? price : parseFloat(price as string);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formattedTotal = safeTotalPrice(cart?.total_price).toFixed(2);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: CheckoutFormData) => orderService.createOrder({
      shipping_address: {
        full_name: data.full_name,
        phone: data.phone,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        city: data.city,
        region: data.region,
        postal_code: data.postal_code,
      },
      payment_method: data.payment_method,
    }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCartCount(0);
      toast.success('Order placed successfully!');
      // Navigate to payment page (Phase 13) or orders page
      navigate(`/payment/${order.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    data.payment_method = selectedPaymentMethod as any;
    createOrderMutation.mutate(data);
  };

  if (isLoadingCart) {
    return (
      <>
        <Navbar />
        <div className="container-custom py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
        </div>
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="container-custom py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <button onClick={() => navigate('/products')} className="btn btn-primary btn-md">
            Browse Products
          </button>
        </div>
      </>
    );
  }

  const paymentMethods = [
    { id: 'momo_mtn', name: 'MTN Mobile Money', icon: Smartphone, color: 'yellow' },
    { id: 'momo_vodafone', name: 'Vodafone Cash', icon: Smartphone, color: 'red' },
    { id: 'momo_airteltigo', name: 'AirtelTigo Money', icon: Smartphone, color: 'blue' },
    { id: 'card', name: 'Debit/Credit Card', icon: CreditCard, color: 'gray' },
  ];

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center text-gray-600 hover:text-primary-600 mb-2 transition text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Cart
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Checkout</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {/* Delivery Information */}
                <div className="card p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Delivery Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Full Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        {...register('full_name', { required: 'Full name is required' })}
                        type="text"
                        className={`input ${errors.full_name ? 'input-error' : ''}`}
                        placeholder="John Doe"
                      />
                      {errors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                      )}
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[0-9+\s-()]+$/,
                            message: 'Invalid phone number',
                          },
                        })}
                        type="tel"
                        className={`input ${errors.phone ? 'input-error' : ''}`}
                        placeholder="+233 XX XXX XXXX"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>
                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        {...register('city', { required: 'City is required' })}
                        type="text"
                        className={`input ${errors.city ? 'input-error' : ''}`}
                        placeholder="Accra"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                      )}
                    </div>
                    {/* Address Line 1 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
                      <input
                        {...register('address_line1', { required: 'Address is required' })}
                        type="text"
                        className={`input ${errors.address_line1 ? 'input-error' : ''}`}
                        placeholder="123 Main Street"
                      />
                      {errors.address_line1 && (
                        <p className="mt-1 text-sm text-red-600">{errors.address_line1.message}</p>
                      )}
                    </div>
                    {/* Address Line 2 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Address Line 2 (Optional)</label>
                      <input
                        {...register('address_line2')}
                        type="text"
                        className="input"
                        placeholder="Apartment, suite, etc."
                      />
                    </div>
                    {/* Region */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Region *</label>
                      <select
                        {...register('region', { required: 'Region is required' })}
                        className={`input ${errors.region ? 'input-error' : ''}`}
                      >
                        <option value="">Select Region</option>
                        <option value="Greater Accra">Greater Accra</option>
                        <option value="Ashanti">Ashanti</option>
                        <option value="Central">Central</option>
                        <option value="Eastern">Eastern</option>
                        <option value="Northern">Northern</option>
                        <option value="Western">Western</option>
                        <option value="Volta">Volta</option>
                        <option value="Upper East">Upper East</option>
                        <option value="Upper West">Upper West</option>
                        <option value="Brong Ahafo">Brong Ahafo</option>
                      </select>
                      {errors.region && (
                        <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
                      )}
                    </div>
                    {/* Postal Code */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Postal Code (Optional)</label>
                      <input
                        {...register('postal_code')}
                        type="text"
                        className="input"
                        placeholder="GA-XXX-XXXX"
                      />
                    </div>
                  </div>
                </div>
                {/* Payment Method */}
                <div className="card p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Payment Method</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`p-3 sm:p-4 border-2 rounded-lg transition flex items-center space-x-2 sm:space-x-3 touch-manipulation ${
                            selectedPaymentMethod === method.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                          }`}
                        >
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 flex-shrink-0" />
                          <span className="font-medium text-sm sm:text-base">{method.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    You will be redirected to complete payment after placing your order.
                  </p>
                </div>
                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="btn btn-primary w-full py-3 sm:py-4 text-base sm:text-lg touch-manipulation"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place Order - GHS ${formattedTotal}`
                  )}
                </button>
              </form>
            </div>
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Order Summary</h2>
                {/* Items */}
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                  {cart.items.map((item) => {
                    const price = typeof item.product.price === 'string'
                      ? parseFloat(item.product.price)
                      : item.product.price;
                    return (
                      <div key={item.id} className="flex justify-between text-xs sm:text-sm gap-2">
                        <span className="text-gray-600 line-clamp-1">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="font-medium whitespace-nowrap">
                          GHS {(price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Totals */}
                <div className="space-y-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 text-sm sm:text-base">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>GHS {formattedTotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary-600">
                    GHS {formattedTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}