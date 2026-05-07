import { apiRequest } from './api';

export const accountService = {
  getAccounts: async (token) => {
    return apiRequest('/api/accounts/', { method: 'GET' }, token);
  },

  createAccount: async (token, data) => {
    return apiRequest('/api/accounts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  updateAccount: async (token, id, data) => {
    return apiRequest(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  deleteAccount: async (token, id) => {
    return apiRequest(`/api/accounts/${id}`, {
      method: 'DELETE',
    }, token);
  }
};
