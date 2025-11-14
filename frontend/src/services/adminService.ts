// frontend/src/services/adminService.ts

import api from './api';
import { Product, Order } from '../types';

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  total_products: number;
  low_stock_products: number;
}

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_urls: string[];
}

interface UpdateProductData extends Partial<CreateProductData> {
  is_active?: boolean;
}

interface UpdateOrderStatusData {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status?: 'pending' | 'completed' | 'failed';
}

export const adminService = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/api/admin/dashboard');
    return response.data;
  },

  /**
   * Get all orders (admin)
   */
  getAllOrders: async (skip: number = 0, limit: number = 50) => {
    const response = await api.get(`/api/admin/orders?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, data: UpdateOrderStatusData): Promise<Order> => {
    const response = await api.put<Order>(`/api/admin/orders/${orderId}`, data);
    return response.data;
  },

  /**
   * Create product
   */
  createProduct: async (data: CreateProductData): Promise<Product> => {
    const response = await api.post<Product>('/api/products', data);
    return response.data;
  },

  /**
   * Update product
   */
  updateProduct: async (productId: string, data: UpdateProductData): Promise<Product> => {
    const response = await api.put<Product>(`/api/products/${productId}`, data);
    return response.data;
  },

  /**
   * Delete product
   */
  deleteProduct: async (productId: string): Promise<void> => {
    await api.delete(`/api/products/${productId}`);
  },
};