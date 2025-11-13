// frontend/src/services/productService.ts

import api from './api';
import { Product, ProductsResponse } from '../types';

interface ProductFilters {
  skip?: number;
  limit?: number;
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const productService = {
  /**
   * Get list of products with filters
   */
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const response = await api.get<ProductsResponse>(`/api/products?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product by ID
   */
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
  },

  /**
   * Get all product categories
   */
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/api/products/categories');
    return response.data;
  },
};