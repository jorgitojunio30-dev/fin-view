import { apiRequest } from './api';

export const reportService = {
  getEvolution: async (token, months = 6) => {
    return apiRequest(`/api/reports/evolution?months=${months}`, { method: 'GET' }, token);
  },

  getCategories: async (token, month = null) => {
    let url = '/api/reports/categories';
    if (month) url += `?month=${month}`;
    return apiRequest(url, { method: 'GET' }, token);
  },

  getInvoiceGrowth: async (token, month = null) => {
    let url = '/api/reports/invoice-growth';
    if (month) url += `?month=${month}`;
    return apiRequest(url, { method: 'GET' }, token);
  }
};
