import api from './api';

const userService = {
  // Lấy danh sách user (admin)
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Lấy chi tiết 1 user (admin)
  getUserDetail: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Chỉnh sửa chi tiết 1 user (admin)
  updateUserDetail: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  }
};

export default userService;
