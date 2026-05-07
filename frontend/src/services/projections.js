import { apiRequest } from './api';

export const projectionService = {
  getNextMonth: async (token) => {
    return apiRequest('/api/projections/next-month', { method: 'GET' }, token);
  }
};
