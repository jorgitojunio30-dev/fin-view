import { apiRequest } from './api';

export const accountService = {
  getAccounts: async (token) => {
    return apiRequest('/api/accounts/', { method: 'GET' }, token);
  },

  createAccount: async (data, token) => {
    return apiRequest('/api/accounts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  updateAccount: async (id, data, token) => {
    return apiRequest(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  deleteAccount: async (id, token) => {
    return apiRequest(`/api/accounts/${id}`, {
      method: 'DELETE',
    }, token);
  }
};
