// frontend/src/types/index.ts

// User Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_admin: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// Cart Types
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
  created_at: string;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  total_price: number;
}

export interface AddToCartData {
  product_id: string;
  quantity: number;
}

// Order Types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card';

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  region: string;
  postal_code?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_reference?: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  shipping_address: ShippingAddress;
  payment_method: PaymentMethod;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// Payment Types
export interface PaymentInitializeData {
  order_id: string;
  payment_method: PaymentMethod;
}

export interface PaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

// Analytics Types (Admin)
export interface SalesAnalytics {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_products: number;
  low_stock_products: number;
  recent_orders: Order[];
}

// API Error Type
export interface ApiError {
  detail: string;
}