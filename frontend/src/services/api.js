import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'text/plain',
  },
});

export const expenseAPI = {
  // Parse expense text
  parseExpenses: async (text) => {
    const response = await api.post('/expenses/parse', text);
    return response.data;
  },

  // Get expenses with filters
  getExpenses: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.minAmount) params.append('minAmount', filters.minAmount);
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/expenses/categories');
    return response.data;
  },

  // Clear all expenses
  clearExpenses: async () => {
    const response = await api.delete('/expenses');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;