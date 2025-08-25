import api from './api';

// Service cho các chức năng liên quan đến lịch sử xem gần đây (chỉ dành cho user đã đăng nhập)
const recentlyViewedService = {
  // Thêm hoặc cập nhật sách đã xem
  addOrUpdateView: async (bookId, duration = 0, interactionScore = 1) => {
    try {
      const response = await api.post('/recently-viewed', {
        bookId,
        duration,
        interactionScore
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thêm/cập nhật lịch sử xem:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Dữ liệu không hợp lệ');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể cập nhật lịch sử xem');
    }
  },

  // Lấy danh sách sách đã xem gần đây
  getRecentViews: async (page = 1, limit = 6) => {
    try {
      const response = await api.get('/recently-viewed', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử xem:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để xem lịch sử');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Dữ liệu không hợp lệ');
      }
      
      throw new Error('Không thể lấy lịch sử xem');
    }
  },

  // Lấy dữ liệu tương tác của user (cho hệ thống gợi ý)
  getUserInteractions: async () => {
    try {
      const response = await api.get('/recently-viewed/interactions');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu tương tác:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Dữ liệu không hợp lệ');
      }
      
      throw new Error('Không thể lấy dữ liệu tương tác');
    }
  },

  // Xóa một sách khỏi lịch sử xem
  removeFromHistory: async (bookId) => {
    try {
      const response = await api.delete(`/recently-viewed/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa khỏi lịch sử xem:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy sách trong lịch sử xem');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Dữ liệu không hợp lệ');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể xóa sách khỏi lịch sử xem');
    }
  },

  // Xóa toàn bộ lịch sử xem
  clearHistory: async () => {
    try {
      const response = await api.delete('/recently-viewed');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa toàn bộ lịch sử xem:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Dữ liệu không hợp lệ');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể xóa lịch sử xem');
    }
  },

  // Hàm tiện ích để ghi lại lượt xem sách (chỉ cho user đã đăng nhập)
  trackBookView: async (bookId, duration = 0, interactionScore = 1) => {
    try {
      return await recentlyViewedService.addOrUpdateView(bookId, duration, interactionScore);
    } catch (error) {
      // Không throw error để không ảnh hưởng đến trải nghiệm user
      console.warn('Không thể ghi lại lượt xem sách:', error.message);
      return null;
    }
  },

  // Hàm tiện ích để lấy lịch sử xem (cập nhật để hỗ trợ phân trang)
  getHistory: async (page = 1, limit = 6) => {
    try {
      return await recentlyViewedService.getRecentViews(page, limit);
    } catch (error) {
      console.warn('Không thể lấy lịch sử xem:', error.message);
      return { success: true, count: 0, totalPages: 0, currentPage: page, data: [] };
    }
  },

  // Hàm tiện ích để xóa sách khỏi lịch sử (cho user đã đăng nhập)
  removeBook: async (bookId) => {
    try {
      return await recentlyViewedService.removeFromHistory(bookId);
    } catch (error) {
      console.warn('Không thể xóa sách khỏi lịch sử:', error.message);
      throw error; // Vẫn throw để UI có thể hiển thị thông báo lỗi
    }
  },

  // Hàm tiện ích để xóa toàn bộ lịch sử (cho user đã đăng nhập)
  clearAllHistory: async () => {
    try {
      return await recentlyViewedService.clearHistory();
    } catch (error) {
      console.error('Lỗi khi xóa toàn bộ lịch sử:', error);
      // Đảm bảo error được throw với message rõ ràng
      throw new Error(error.message || 'Không thể xóa lịch sử xem');
    }
  },

  // Hàm tiện ích để kiểm tra sách có trong lịch sử xem không (chỉ cho user đã đăng nhập)
  isBookInHistory: async (bookId) => {
    try {
      const historyData = await recentlyViewedService.getHistory(1, 40); // Lấy tối đa 40 sách
      
      if (!historyData.success || !historyData.data) {
        return false;
      }
      
      return historyData.data.some(item => 
        item.bookId && item.bookId._id === bookId
      );
    } catch (error) {
      console.warn('Không thể kiểm tra sách trong lịch sử:', error.message);
      return false;
    }
  }
};

export default recentlyViewedService;
