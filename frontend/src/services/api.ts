import axios from 'axios';
import { Expense, ExpenseAnalytics, FilterSettings } from '../types';

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
  message?: string;
}

export interface ParseExpensesData {
  expenses: Expense[];
  categoryTotals: Record<string, number>;
  analytics: ExpenseAnalytics;
  message: string;
}

export interface GetExpensesData {
  expenses: Expense[];
  categoryTotals: Record<string, number>;
  analytics: ExpenseAnalytics;
  filtersApplied: boolean;
}

export interface GetCategoriesData {
  categories: string[];
}

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const expenseAPI = {
  // Parse expense text
  parseExpenses: async (text: string): Promise<APIResponse<ParseExpensesData>> => {
    const response = await api.post<APIResponse<ParseExpensesData>>('/expenses/parse', text, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  },

  // Get expenses with filters
  getExpenses: async (filters: FilterSettings = {}): Promise<APIResponse<GetExpensesData>> => {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());

    const response = await api.get<APIResponse<GetExpensesData>>(`/expenses?${params.toString()}`);
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<APIResponse<GetCategoriesData>> => {
    const response = await api.get<APIResponse<GetCategoriesData>>('/expenses/categories');
    return response.data;
  },

  // Clear all expenses
  clearExpenses: async (): Promise<APIResponse<{ message: string }>> => {
    const response = await api.delete<APIResponse<{ message: string }>>('/expenses');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; message: string; timestamp: string }> => {
    const response = await api.get<{ status: string; message: string; timestamp: string }>('/health');
    return response.data;
  },
};

export const authAPI = {
  login: async (credentials: any): Promise<APIResponse<any>> => {
    const response = await api.post<APIResponse<any>>('/auth/login', credentials);
    return response.data;
  },
  register: async (credentials: any): Promise<APIResponse<any>> => {
    const response = await api.post<APIResponse<any>>('/auth/register', credentials);
    return response.data;
  }
};

export default api;