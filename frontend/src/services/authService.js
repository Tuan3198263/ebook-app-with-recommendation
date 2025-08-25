import api from './api';

// Service cho các chức năng xác thực
const authService = {
  // Đăng nhập
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Đăng ký
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Cập nhật thông tin người dùng
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/update-profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Cập nhật avatar
  updateAvatar: async (formData) => {
    try {
      const response = await api.put('/auth/update-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Lấy thông tin cá nhân người dùng
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Kiểm tra trạng thái đăng nhập
  checkAuthStatus: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Đăng xuất
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;
