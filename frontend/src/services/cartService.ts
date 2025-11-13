// frontend/src/services/cartService.ts

import api from './api';
import { Cart, CartItem } from '../types';

export const cartService = {
  /**
   * Get user's cart
   */
  getCart: async (): Promise<Cart> => {
    const response = await api.get<Cart>('/api/cart');
    return response.data;
  },

  /**
   * Add item to cart
   */
  addToCart: async (productId: string, quantity: number = 1): Promise<CartItem> => {
    const response = await api.post<CartItem>('/api/cart/items', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  /**
   * Update cart item quantity
   */
  updateCartItem: async (itemId: string, quantity: number): Promise<CartItem> => {
    const response = await api.put<CartItem>(`/api/cart/items/${itemId}`, {
      quantity,
    });
    return response.data;
  },

  /**
   * Remove item from cart
   */
  removeCartItem: async (itemId: string): Promise<void> => {
    await api.delete(`/api/cart/items/${itemId}`);
  },

  /**
   * Clear entire cart
   */
  clearCart: async (): Promise<void> => {
    await api.delete('/api/cart');
  },
};