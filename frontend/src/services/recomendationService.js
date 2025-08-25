import api from './api';



export const featuredService = {

  getFeaturedBooks: async () => {
    try {
      const response = await api.get('/recomendation/books');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy sách nổi bật:', error);
      throw error;
    }
  },

  // 🤖 Lấy danh sách sách được gợi ý cá nhân hóa
  getRecommendedBooks: async () => {
    try {
      const response = await api.get('/recomendation/recommend'); // ⬅️ Gọi đến hàm tổng hợp
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy sách được gợi ý:', error);
      throw error;
    }
  }

};

export default featuredService;
