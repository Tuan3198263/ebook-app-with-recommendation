import api from './api';

// Service cho các chức năng liên quan đến danh sách yêu thích
const favoriteService = {
  // Toggle thêm/xóa sách khỏi danh sách yêu thích
  toggleFavorite: async (bookId) => {
    try {
      const response = await api.post('/favorites/toggle', { bookId });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thao tác với danh sách yêu thích:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy sách');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể cập nhật danh sách yêu thích');
    }
  },

  // Kiểm tra trạng thái yêu thích của một sách
  checkFavoriteStatus: async (bookId) => {
    try {
      const response = await api.get(`/favorites/check/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
      return { success: true, isFavorited: false };
    }
  },

  // Lấy danh sách sách yêu thích của người dùng
  getFavoriteBooks: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/favorites', {
        params: { page, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách yêu thích:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để xem danh sách yêu thích');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể tải danh sách yêu thích');
    }
  },

  // Xóa một sách khỏi danh sách yêu thích
  removeFavorite: async (bookId) => {
    try {
      const response = await api.delete(`/favorites/${bookId}`);
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa khỏi danh sách yêu thích:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
      }
      if (error.response?.status === 404) {
        throw new Error('Sách không có trong danh sách yêu thích');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể xóa khỏi danh sách yêu thích');
    }
  },

  // Kiểm tra nhiều sách có trong danh sách yêu thích không (tiện ích)
  checkMultipleFavoriteStatus: async (bookIds) => {
    try {
      const promises = bookIds.map(bookId => 
        favoriteService.checkFavoriteStatus(bookId)
      );
      const results = await Promise.all(promises);
      
      // Tạo object mapping bookId -> isFavorited
      const statusMap = {};
      bookIds.forEach((bookId, index) => {
        statusMap[bookId] = results[index]?.isFavorited || false;
      });
      
      return statusMap;
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái yêu thích nhiều sách:', error);
      throw error;
    }
  },

  // Thêm nhiều sách vào danh sách yêu thích cùng lúc
  addMultipleToFavorites: async (bookIds) => {
    try {
      const promises = bookIds.map(bookId => 
        favoriteService.toggleFavorite(bookId)
      );
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Lỗi khi thêm nhiều sách vào yêu thích:', error);
      throw error;
    }
  }
};

export default favoriteService;
