import { apiRequest } from './api';

export const dashboardService = {
  getSummary: async (token, month = null, accountId = null) => {
    let url = '/api/dashboard/summary';
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (accountId) params.append('account_id', accountId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return apiRequest(url, { method: 'GET' }, token);
  }
};
