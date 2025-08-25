import api from './api';

// Service cho các chức năng liên quan đến tác giả
const authorService = {
  // Lấy tất cả tác giả
  getAllAuthors: async () => {
    try {
      const response = await api.get('/authors');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Lấy chi tiết tác giả theo ID hoặc slug
  getAuthorDetail: async (idOrSlug) => {
    try {
      const response = await api.get(`/authors/${idOrSlug}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Tạo tác giả mới
  createAuthor: async (authorData) => {
    try {
      const response = await api.post('/authors', authorData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Cập nhật tác giả
  updateAuthor: async (id, authorData) => {
    try {
      const response = await api.put(`/authors/${id}`, authorData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Xóa tác giả
  deleteAuthor: async (id) => {
    try {
      const response = await api.delete(`/authors/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách ngắn gọn tác giả (chỉ _id và name) cho dropdown
  getAuthorsList: async () => {
    try {
      const response = await api.get('/authors/list');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách tác giả theo danh mục sách
  getAuthorsByCategory: async (categorySlug) => {
    try {
      const response = await api.get(`/authors/by-category/${categorySlug}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách tác giả theo từ khóa tìm kiếm của sách
  getAuthorsByBookKeyword: async (keyword) => {
    try {
      const response = await api.get('/authors/by-book-keyword', {
        params: { q: keyword }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authorService;
