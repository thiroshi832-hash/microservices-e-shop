export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  category?: string;
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  user: User;
  product: Product;
  quantity: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
}
