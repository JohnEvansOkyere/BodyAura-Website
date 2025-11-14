// frontend/src/components/ProductFormModal.tsx

import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
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
  is_active: boolean;
}

export default function ProductFormModal({ product, onClose, onSuccess }: ProductFormModalProps) {
  const isEditing = !!product;

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      category: product.category,
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls?.join('\n') || '',
      is_active: product.is_active,
    } : {
      is_active: true,
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
        is_active: data.is_active,
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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Product Name *</label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g., Vitamin C Tablets"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
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

            <div className="grid md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-2">Price (GHS) *</label>
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
                <label className="block text-sm font-medium mb-2">Stock Quantity *</label>
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
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <input
                {...register('category', { required: 'Category is required' })}
                type="text"
                className={`input ${errors.category ? 'input-error' : ''}`}
                placeholder="e.g., Vitamins, Supplements"
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Image URLs */}
            <div>
              <label className="block text-sm font-medium mb-2">Image URLs (one per line)</label>
              <textarea
                {...register('image_urls')}
                rows={3}
                className="input"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              />
              <p className="mt-1 text-sm text-gray-500">Add one image URL per line</p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                {...register('is_active')}
                type="checkbox"
                id="is_active"
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Product is active (visible to customers)
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline btn-md"
                disabled={mutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-md"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEditing ? 'Update Product' : 'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}