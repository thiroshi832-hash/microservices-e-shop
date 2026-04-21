import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/users/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/users/login', data),

  getMe: (userId: number) =>
    api.get<User>(`/users/${userId}`),
};

// Products API
export const productsApi = {
  getAll: (params?: { category?: string; minPrice?: number; maxPrice?: number }) =>
    api.get<Product[]>('/products', { params }),

  getById: (id: number) =>
    api.get<Product>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    api.post<Product>('/products', data),

  update: (id: number, data: Partial<Product>) =>
    api.put<Product>(`/products/${id}`, data),

  delete: (id: number) =>
    api.delete(`/products/${id}`),
};

// Orders API
export const ordersApi = {
  getAll: () =>
    api.get<Order[]>('/orders'),

  getById: (id: number) =>
    api.get<Order>(`/orders/${id}`),

  create: (data: { userId: number; productId: number; quantity?: number }) =>
    api.post<Order>('/orders', data),

  getUserOrders: (userId: number) =>
    api.get<Order[]>(`/orders/user/${userId}`),

  updateStatus: (id: number, status: string) =>
    api.put<Order>(`/orders/${id}/status`, { status }),
};
