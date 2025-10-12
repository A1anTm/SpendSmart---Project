import axios from 'axios';

const baseURL =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3002') + '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export const setupApiInterceptors = (onUnauthorized: () => void) => {
  const interceptor = api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        onUnauthorized();
      }
      return Promise.reject(err);
    }
  );
  return () => api.interceptors.response.eject(interceptor);
};

export const setAuthToken = (token: string | null) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

export const refreshAccessToken = async () => {
  const resp = await api.post('/users/auth/refresh-token');
  return resp.data;
};

export default api;
