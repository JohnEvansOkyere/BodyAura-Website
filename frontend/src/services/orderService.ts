// frontend/src/services/orderService.ts

import api from './api';
import { Order } from '../types';

interface CreateOrderData {
  shipping_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    region: string;
    postal_code?: string;
  };
  payment_method: 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card';
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export const orderService = {
  /**
   * Create order from cart
   */
  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await api.post<Order>('/api/orders', data);
    return response.data;
  },

  /**
   * Get user's orders
   */
  getOrders: async (skip: number = 0, limit: number = 20): Promise<OrdersResponse> => {
    const response = await api.get<OrdersResponse>(`/api/orders?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  /**
   * Get single order by ID
   */
  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/api/orders/${orderId}`);
    return response.data;
  },
};