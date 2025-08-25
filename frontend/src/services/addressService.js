import api from './api.js';

const API_ENDPOINT = '/addresses';

// Lấy địa chỉ của người dùng
const getUserAddress = async () => {
  try {
    const response = await api.get(API_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy địa chỉ:', error);
    throw error;
  }
};

// Tạo hoặc cập nhật địa chỉ
const createOrUpdateAddress = async (addressData) => {
  try {
    const response = await api.post(API_ENDPOINT, addressData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lưu địa chỉ:', error);
    throw error;
  }
};

export default {
  getUserAddress,
  createOrUpdateAddress
};
