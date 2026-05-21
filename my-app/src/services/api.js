// Base API config – tự động đính kèm JWT Token vào mọi request
const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7088/api';

function getAuthHeaders() {
  const token = localStorage.getItem('renats_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),   // Tự động đính kèm JWT
      ...options.headers,    // Cho phép ghi đè header nếu cần
    },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Token hết hạn hoặc không hợp lệ → xóa session và redirect về trang đăng nhập
      localStorage.removeItem('renats_token');
      localStorage.removeItem('renats_user');
      window.location.href = '/dang-nhap';
    }
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (path, params, options = {}) => {
    const url = params
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    return request(url, options);
  },
  post: (path, body, options = {}) =>
    request(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  patch: (path, body, options = {}) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  put: (path, body, options = {}) =>
    request(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (path, options = {}) =>
    request(path, { method: 'DELETE', ...options }),
};
