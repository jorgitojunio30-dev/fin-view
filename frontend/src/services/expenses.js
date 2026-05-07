import { apiRequest } from './api';

export const expenseService = {
  getExpenses: async (token, month = null, accountId = null) => {
    let query = '?';
    if (month) query += `month=${month}&`;
    if (accountId) query += `account_id=${accountId}`;
    
    if (query === '?') query = '';
    if (query.endsWith('&')) query = query.slice(0, -1);

    return apiRequest(`/api/expenses/${query}`, { method: 'GET' }, token);
  },

  createExpense: async (token, expenseData) => {
    return apiRequest('/api/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }, token);
  },

  updateExpense: async (token, expenseId, expenseData, scope = 'single') => {
    return apiRequest(`/api/expenses/${expenseId}?scope=${scope}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }, token);
  },

  deleteExpense: async (token, expenseId, scope = 'single') => {
    return apiRequest(`/api/expenses/${expenseId}?scope=${scope}`, {
      method: 'DELETE',
    }, token);
  }
};
