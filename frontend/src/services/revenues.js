import { apiRequest } from './api';

export const revenueService = {
  getRevenues: async (token, month = null, accountId = null) => {
    let query = '?';
    if (month) query += `month=${month}&`;
    if (accountId) query += `account_id=${accountId}`;

    if (query === '?') query = '';
    if (query.endsWith('&')) query = query.slice(0, -1);

    return apiRequest(`/api/revenues/${query}`, { method: 'GET' }, token);
  },

  createRevenue: async (token, data) => {
    return apiRequest('/api/revenues/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  updateRevenue: async (token, id, data, scope = 'single') => {
    return apiRequest(`/api/revenues/${id}?scope=${scope}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  deleteRevenue: async (token, id, scope = 'single') => {
    return apiRequest(`/api/revenues/${id}?scope=${scope}`, {
      method: 'DELETE',
    }, token);
  },

  toggleStatus: async (token, id) => {
    return apiRequest(`/api/revenues/${id}/toggle-status`, {
      method: 'PATCH',
    }, token);
  }
};
