import { api } from './api';

export const adminService = {
  // Lấy thống kê trang dashboard admin
  getStats: () => api.get('/admin/stats'),

  // Lấy danh sách người dùng với bộ lọc, tìm kiếm và phân trang
  getUsers: (params) => api.get('/admin/users', params),

  // Lấy chi tiết thông tin người dùng và profile theo role
  getUser: (id) => api.get(`/admin/users/${id}`),

  // Tạo mới một người dùng (kèm profile tương ứng)
  createUser: (data) => api.post('/admin/users', data),

  // Cập nhật thông tin người dùng (kèm profile tương ứng)
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),

  // Xóa người dùng (nếu không có giao dịch liên quan)
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};
