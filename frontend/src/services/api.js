// frontend/src/services/api.js

import axios from 'axios';

// ATUALIZADO: Muda a URL base para usar o proxy do Vercel no mesmo domínio.
// Isso resolve a falha de cookies SameSite/ITP no iOS e Desktop.
const API_URL = '/api'; 

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth
export const getCurrentUser = () => api.get('/auth/current-user');
export const logout = () => api.post('/auth/logout');

// Gifts
export const getGifts = () => api.get('/gifts');
export const chooseGift = (giftId) => api.post(`/gifts/${giftId}/choose`);

// Admin
export const addGift = (giftData) => api.post('/gifts', giftData);
export const editGift = (giftId, giftData) => api.put(`/gifts/${giftId}`, giftData);
export const deleteGift = (giftId) => api.delete(`/gifts/${giftId}`);
export const getAdminReport = () => api.get('/gifts/admin/report');

export default api;