import { apiRequest } from './api';

export const invoiceService = {
  getInvoices: async (token, cardId = null, month = null) => {
    let url = '/api/invoices/';
    const params = new URLSearchParams();
    if (cardId) params.append('card_id', cardId);
    if (month) params.append('month', month);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return apiRequest(url, { method: 'GET' }, token);
  },

  saveInvoice: async (token, data) => {
    return apiRequest('/api/invoices/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  payInvoice: async (token, invoiceId, paymentData) => {
    return apiRequest(`/api/invoices/${invoiceId}/pay`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    }, token);
  }
};
