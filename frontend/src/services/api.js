import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Tạo instance Axios với cấu hình mặc định
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Thêm interceptor cho request để đính kèm token xác thực
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor cho response để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi 401 Unauthorized (token hết hạn hoặc không hợp lệ)
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      // Chuyển hướng đến trang đăng nhập nếu cần
      // router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
