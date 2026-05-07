import { apiRequest } from './api';

export const cardService = {
  getCards: async (token) => {
    return apiRequest('/api/cards/', { method: 'GET' }, token);
  },

  createCard: async (token, cardData) => {
    return apiRequest('/api/cards/', {
      method: 'POST',
      body: JSON.stringify(cardData),
    }, token);
  },

  updateCard: async (token, cardId, cardData) => {
    return apiRequest(`/api/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(cardData),
    }, token);
  },

  deleteCard: async (token, cardId) => {
    return apiRequest(`/api/cards/${cardId}`, {
      method: 'DELETE',
    }, token);
  },

  // Purchases
  createPurchase: async (token, purchaseData) => {
    return apiRequest('/api/cards/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    }, token);
  },

  getPurchases: async (token, month, cardId = null) => {
    let url = `/api/cards/purchases/${month}`;
    if (cardId) url += `?card_id=${cardId}`;
    return apiRequest(url, { method: 'GET' }, token);
  },

  deletePurchase: async (token, purchaseId) => {
    return apiRequest(`/api/cards/purchases/${purchaseId}`, {
      method: 'DELETE',
    }, token);
  }
};
