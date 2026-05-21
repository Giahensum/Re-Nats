// Base axios config
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5092/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
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
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) =>
    request(path, { method: 'DELETE' }),
};

