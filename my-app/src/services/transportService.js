import { api } from './api';

export const transportService = {
    // ── Driver lấy danh sách kho có đơn cần vận chuyển ────────────────────────
    getDepotsWithJobs: async (lat, lng) => {
        return await api.get('/transport/depots-with-jobs', { lat, lng });
    },

    // ── Lấy đơn vận chuyển khả dụng theo kho ──────────────────────────────────
    getAvailableJobs: async (depotId) => {
        return await api.get('/transport/jobs/available', { depotId });
    },

    // ── Tài xế nhận đơn vận chuyển ────────────────────────────────────────────
    acceptJob: async (jobId) => {
        return await api.post(`/transport/jobs/${jobId}/accept`);
    },

    // ── Lấy danh sách chuyến của tài xế đang đăng nhập ────────────────────────
    getMyJobs: async () => {
        return await api.get('/transport/jobs/my');
    },

    // ── Cập nhật trạng thái chuyến (đang chạy, đã giao...) ────────────────────
    updateJobStatus: async (jobId, status) => {
        return await api.put(`/transport/jobs/${jobId}/status`, { status });
    },

    // ── Check-in tại điểm đón/giao ────────────────────────────────────────────
    checkin: async (jobId, payload) => {
        return await api.post(`/transport/jobs/${jobId}/checkin`, payload);
    },

    // ── Từ chối / huỷ đơn ─────────────────────────────────────────────────────
    rejectJob: async (jobId, reason) => {
        return await api.post(`/transport/jobs/${jobId}/reject`, { reason });
    },

    // ── Upload ảnh lên Cloudinary ─────────────────────────────────────────────
    uploadImage: async (file) => {
        const token = localStorage.getItem('renats_token');
        const formData = new FormData();
        formData.append('file', file);

        const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7088/api';
        const res = await fetch(`${BASE_URL}/shared/upload`, {
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
};

