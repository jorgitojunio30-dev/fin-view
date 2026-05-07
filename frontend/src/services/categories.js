import { apiRequest } from './api';

export const categoryService = {
  getCategories: async (token, type = null) => {
    let url = '/api/categories/';
    if (type) url += `?type=${type}`;
    
    return apiRequest(url, { method: 'GET' }, token);
  },

  createCategory: async (token, data) => {
    return apiRequest('/api/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  updateCategory: async (token, id, data) => {
    return apiRequest(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  deleteCategory: async (token, id) => {
    return apiRequest(`/api/categories/${id}`, {
      method: 'DELETE',
    }, token);
  }
};
