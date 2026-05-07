import { apiRequest } from './api';

export const alertService = {
  getAlerts: async (token) => {
    return apiRequest('/api/alerts/', { method: 'GET' }, token);
  }
};
