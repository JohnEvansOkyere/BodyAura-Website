// frontend/src/components/ProductFormModal.tsx

import { useForm } from 'react-hook-form';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_urls: string;
  video_url: string;
  is_active: boolean;
  is_trending: boolean;
  free_delivery: boolean;
}

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

export default function ProductFormModal({ product, onClose, onSuccess }: ProductFormModalProps) {
  const isEditing = !!product;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProductFormData>({
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      category: product.category,
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls?.join('\n') || '',
      video_url: product.video_url || '',
      is_active: product.is_active,
      is_trending: (product.trending_score || 0) > 0,
      free_delivery: (product.shipping_cost || 0) === 0,
    } : {
      is_active: true,
      is_trending: false,
      free_delivery: true,
      video_url: '',
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const imageUrls = data.image_urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        stock_quantity: data.stock_quantity,
        image_urls: imageUrls,
        video_url: data.video_url?.trim() || undefined,
        shipping_cost: data.free_delivery ? 0 : 10, // Default delivery cost if not free
        is_active: data.is_active,
        trending_score: data.is_trending ? 100 : 0,
      };

      if (isEditing) {
        return adminService.updateProduct(product.id, productData);
      } else {
        return adminService.createProduct(productData);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Product updated!' : 'Product created!');
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to save product');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ position: 'absolute', backgroundColor: '#1a1a1a' }}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 flex justify-between items-center z-10 rounded-t-lg">
          <h2 className="text-2xl font-bold">
            {isEditing ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Product Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g., Wireless Bluetooth Earbuds"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Description *</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className={`input ${errors.description ? 'input-error' : ''}`}
              placeholder="Detailed product description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Price (GHS) *</label>
              <input
                {...register('price', {
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                })}
                type="number"
                step="0.01"
                className={`input ${errors.price ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Stock Quantity *</label>
              <input
                {...register('stock_quantity', {
                  required: 'Stock quantity is required',
                  min: { value: 0, message: 'Cannot be negative' },
                })}
                type="number"
                className={`input ${errors.stock_quantity ? 'input-error' : ''}`}
                placeholder="0"
              />
              {errors.stock_quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.stock_quantity.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className={`input ${errors.category ? 'input-error' : ''}`}
              >
                <option value="">Select category</option>
                {CHINA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Image URLs */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            <div className="flex items-center space-x-2 mb-2">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <label className="block text-sm font-semibold text-gray-700">Product Images (URLs) *</label>
            </div>
            <textarea
              {...register('image_urls', { required: 'At least one image URL is required' })}
              rows={3}
              className={`input ${errors.image_urls ? 'input-error' : ''}`}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
            />
            <p className="mt-2 text-xs text-gray-600">
              📸 Add one image URL per line (you can add multiple images)
            </p>
            <p className="mt-1 text-xs text-gray-500">
              💡 Tip: Upload images to imgur.com or imgbb.com and paste the URLs here
            </p>
            {errors.image_urls && (
              <p className="mt-1 text-sm text-red-600">{errors.image_urls.message}</p>
            )}
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Product Video URL (Optional)</label>
            <input
              {...register('video_url')}
              type="url"
              className="input"
              placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
            />
            <p className="mt-1 text-xs text-gray-600">
              🎥 Add a YouTube link or direct video URL to showcase your product
            </p>
          </div>

          {/* Toggles */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 space-y-3 border border-orange-200">
            <h3 className="font-semibold text-gray-800 mb-3">Product Settings</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  id="is_active"
                  className="w-5 h-5 text-red-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  ✅ Product is active (visible to customers)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  {...register('is_trending')}
                  type="checkbox"
                  id="is_trending"
                  className="w-5 h-5 text-red-600 rounded"
                />
                <label htmlFor="is_trending" className="text-sm font-medium text-gray-700">
                  🔥 Mark as trending product
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-orange-200 pt-3">
              <div className="flex items-center space-x-3">
                <input
                  {...register('free_delivery')}
                  type="checkbox"
                  id="free_delivery"
                  className="w-5 h-5 text-green-600 rounded"
                />
                <label htmlFor="free_delivery" className="text-sm font-medium text-gray-700">
                  🚚 Free Delivery
                </label>
              </div>
              <span className="text-xs text-gray-600">
                {watch('free_delivery') ? '✓ Free delivery' : 'GHS 10.00 delivery charge'}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition disabled:opacity-50"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                  Saving...
                </>
              ) : (
                isEditing ? '💾 Update Product' : '➕ Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
