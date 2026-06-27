import { api } from './api';

// ── Lấy factoryId từ session ───────────────────────────────────────────────────
function getFactoryId() {
  try {
    const raw = localStorage.getItem('renats_user');
    const user = raw ? JSON.parse(raw) : null;
    if (user?.profileId) return user.profileId;
  } catch { /* ignore */ }
  return null;
}

// ── Lấy profile nhà máy đã lưu (sau khi setup) ────────────────────────────────
export function getFactoryProfile() {
  try {
    const raw = localStorage.getItem('renats_factory_profile');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveFactoryProfile(profile) {
  localStorage.setItem('renats_factory_profile', JSON.stringify(profile));
}

export function clearFactoryProfile() {
  localStorage.removeItem('renats_factory_profile');
}

export const factoryService = {
  // ── Dashboard ──
  getKpis: () =>
    api.get('/factory/dashboard/kpis', { factoryId: getFactoryId() }),

  getRecentTransactions: () =>
    api.get('/factory/dashboard/transactions', { factoryId: getFactoryId() }),

  getMaterialBreakdown: () =>
    api.get('/factory/dashboard/material-breakdown', { factoryId: getFactoryId() }),

  getChartData: (range = 'week') =>
    api.get('/factory/dashboard/chart', { factoryId: getFactoryId(), range }),

  // ── Profile ──
  getProfile: () =>
    api.get('/factory/profile'),

  updateProfile: (data) =>
    api.put('/factory/profile', data),

  uploadDocument: async (file, documentType = 'business_license') => {
    const token = localStorage.getItem('renats_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7088/api';
    const res = await fetch(`${BASE_URL}/factory/profile/upload-document`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  },

  uploadTempDocument: async (file) => {
    const token = localStorage.getItem('renats_token');
    const formData = new FormData();
    formData.append('file', file);

    const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7088/api';
    const res = await fetch(`${BASE_URL}/factory/profile/upload-temp`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // ── Market ──
  getBatches: (params = {}) => {
    // Tự động truyền materialType từ profile nhà máy
    const profile = getFactoryProfile();
    const materialType = profile?.primaryMaterialType;
    return api.get('/factory/market/batches', {
      factoryId: getFactoryId(),
      ...(materialType ? { material: materialType } : {}),
      ...params,
    });
  },

  getBatchesAll: (params = {}) =>
    api.get('/factory/market/batches', { factoryId: getFactoryId(), ...params }),

  getBatchDetail: (id) =>
    api.get(`/factory/market/batches/${id}`, { factoryId: getFactoryId() }),

  // ── Orders ──
  placeBid: (batchId, bidPrice, note) =>
    api.post('/factory/orders/bid', {
      batchId, factoryId: getFactoryId(), bidPrice, note,
    }),

  confirmOrder: (bidId) =>
    api.post('/factory/orders/confirm', { bidId }),

  getOrders: (status) =>
    api.get('/factory/orders', { factoryId: getFactoryId(), ...(status ? { status } : {}) }),

  getOrderDetail: (id) =>
    api.get(`/factory/orders/${id}`),

  // ── Weighing/KCS ──
  getWeighingQueue: () =>
    api.get('/factory/weighing/queue', { factoryId: getFactoryId() }),

  completeWeighing: (orderId, data) =>
    api.post(`/factory/weighing/${orderId}/complete`, data),

  settleInvoice: (orderId) =>
    api.post(`/factory/weighing/${orderId}/settle`),

  rejectTruck: (orderId, reason) =>
    api.post(`/factory/weighing/${orderId}/reject`, { reason }),

  // ── Partners ──
  getPartners: () =>
    api.get('/factory/partners', { factoryId: getFactoryId() }),

  getPartnerDetail: (id) =>
    api.get(`/factory/partners/${id}`, { factoryId: getFactoryId() }),

  // ── Premium Subscription ──
  getPremiumStatus: () =>
    api.get('/factory/premium/status', { factoryId: getFactoryId() }),

  subscribePremium: (plan) =>
    api.post('/factory/premium/subscribe', { factoryId: getFactoryId(), plan }),

  // ── Simulation ──
  simulateStep: (orderId, data) =>
    api.post(`/factory/orders/${orderId}/simulate-step`, data),
};

