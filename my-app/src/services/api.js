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
    const isAuthRequest = path.includes('/auth/login') ||
                          path.includes('/auth/register') ||
                          path.includes('/auth/google-login') ||
                          path.includes('/auth/facebook-login');

    if (res.status === 401 && !isAuthRequest) {
      // Token hết hạn hoặc không hợp lệ → xóa session và redirect về trang đăng nhập
      localStorage.removeItem('renats_token');
      localStorage.removeItem('renats_user');
      window.location.href = '/dang-nhap';
      return;
    }

    const errText = await res.text();
    let errorMessage = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed && parsed.message) {
        errorMessage = parsed.message;
      }
    } catch {
      // Ignore if not valid JSON or doesn't have a message
    }

    throw new Error(errorMessage || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (path, params, options = {}) => {
    let url = path;
    if (params) {
      const cleanParams = {};
      Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== 'null' && val !== 'undefined' && val !== '') {
          cleanParams[key] = val;
        }
      });
      const search = new URLSearchParams(cleanParams).toString();
      if (search) {
        url = `${path}?${search}`;
      }
    }
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
