import { api } from './api';

export const authService = {
  // ── Đăng nhập truyền thống ──────────────────────────────────────────────
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  // ── Đăng ký ─────────────────────────────────────────────────────────────
  register: (data) =>
    api.post('/auth/register', data),

  // ── Lấy thông tin User hiện tại (JWT đã gắn tự động trong api.js) ───────
  me: () => api.get('/auth/me'),

  // ── Đăng nhập bằng Google ────────────────────────────────────────────────
  // idToken: chuỗi credential trả về từ Google Identity Services
  loginWithGoogle: (idToken, role = null) =>
    api.post('/auth/google-login', { token: idToken, role }),

  // ── Đăng nhập bằng Facebook ──────────────────────────────────────────────
  // accessToken: trả về từ Facebook JavaScript SDK
  loginWithFacebook: (accessToken, role = null) =>
    api.post('/auth/facebook-login', { token: accessToken, role }),

  // ── Quản lý Session ─────────────────────────────────────────────────────
  saveSession: (authResponse) => {
    localStorage.setItem('renats_token', authResponse.token);
    localStorage.setItem('renats_user', JSON.stringify({
      userId:   authResponse.userId,
      role:     authResponse.role,
      fullName: authResponse.fullName,
      email:    authResponse.email,
    }));
  },

  getSession: () => {
    try {
      const raw = localStorage.getItem('renats_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  logout: () => {
    localStorage.removeItem('renats_token');
    localStorage.removeItem('renats_user');
  },

  isLoggedIn: () => !!localStorage.getItem('renats_token'),
};
