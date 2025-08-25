import api from './api';

const bookService = {
  // Lấy tất cả sách (cho admin)
  getAllBooks: async () => {
    try {
      const response = await api.get('/books');
      return response.data;
    } catch (error) {
      console.error('Error fetching all books:', error);
      throw error;
    }
  },

  // Tạo sách mới
  createBook: async (formData) => {
    try {
      const response = await api.post('/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  },

  // Cập nhật sách
  updateBook: async (id, formData) => {
    try {
      const response = await api.put(`/books/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  },

  // Lấy chi tiết sách
  getBookDetail: async (slug) => {
    try {
      const response = await api.get(`/books/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book detail:', error);
      throw error;
    }
  },

  // Lấy chi tiết sách theo ID
  getBookDetailById: async (id) => {
    try {
      const response = await api.get(`/books/detail/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book detail by ID:', error);
      throw error;
    }
  },

  // Tìm kiếm sách
  searchBooks: async (params) => {
    try {
      const response = await api.get('/books/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  },

  // Lấy sách theo danh mục
  getBooksByCategory: async (categorySlug, params = {}) => {
    try {
      const response = await api.get(`/books/by-category/${categorySlug}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching books by category:', error);
      throw error;
    }
  },

  // Toggle trạng thái hiển thị sách
  toggleBookStatus: async (id, status) => {
    try {
      const response = await api.patch(`/books/${id}/toggle-status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error toggling book status:', error);
      throw error;
    }
  },

  // Toggle trạng thái nổi bật
  toggleFeaturedStatus: async (id, featured) => {
    try {
      const response = await api.patch(`/books/${id}/toggle-featured`, { featured });
      return response.data;
    } catch (error) {
      console.error('Error toggling featured status:', error);
      throw error;
    }
  }
};

export default bookService;
