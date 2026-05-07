import { apiRequest } from './api';

export const revenueService = {
  getRevenues: async (token, month = null, accountId = null) => {
    let query = '?';
    if (month) query += `month=${month}&`;
    if (accountId) query += `account_id=${accountId}`;

    // remove trailing ? or &
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

  updateRevenue: async (token, id, data) => {
    return apiRequest(`/api/revenues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  deleteRevenue: async (token, id) => {
    return apiRequest(`/api/revenues/${id}`, {
      method: 'DELETE',
    }, token);
  }
};
