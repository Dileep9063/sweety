const BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => localStorage.getItem('sweety_token');

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Expired / invalid token on a protected route: send the user back to login
    if (res.status === 401 && !path.startsWith('/auth')) {
      localStorage.removeItem('sweety_token');
      localStorage.removeItem('sweety_user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  getReadings: (date) => request(`/readings${date ? `?date=${date}` : ''}`),
  addReading: (body) => request('/readings', { method: 'POST', body }),
  updateReading: (id, body) => request(`/readings/${id}`, { method: 'PUT', body }),
  deleteReading: (id) => request(`/readings/${id}`, { method: 'DELETE' }),
  getReports: (date) => request(`/reports?date=${date}`),
};
