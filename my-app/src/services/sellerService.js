import { api } from './api';
import { authService } from './authService';

// Lấy sellerId động từ session của User đang đăng nhập
function getSellerIdFromSession() {
  const session = authService.getSession();
  if (!session?.userId) throw new Error('Chưa đăng nhập hoặc không tìm thấy thông tin User.');
  return session.userId;
}

export const sellerService = {
  // ── Dashboard / Requests ──────────────────────────────────────────────────
  getRequests: (status) =>
    api.get('/seller/requests', {
      sellerId: getSellerIdFromSession(),
      ...(status ? { status } : {}),
    }),

  getRequestDetail: (id) =>
    api.get(`/seller/requests/${id}`),

  createRequest: (data) =>
    api.post('/seller/requests', { sellerId: getSellerIdFromSession(), ...data }),

  cancelRequest: (id) =>
    api.patch(`/seller/requests/${id}/cancel`),

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: () =>
    api.get(`/seller/profile/${getSellerIdFromSession()}`),

  updateProfile: (data) =>
    api.put(`/seller/profile/${getSellerIdFromSession()}`, data),

  changePassword: (oldPassword, newPassword) =>
    api.patch(`/seller/profile/${getSellerIdFromSession()}/change-password`, {
      oldPassword, newPassword,
    }),

  deleteAccount: () =>
    api.delete(`/seller/profile/${getSellerIdFromSession()}`),

  getStats: () =>
    api.get(`/seller/profile/${getSellerIdFromSession()}/stats`),
};
