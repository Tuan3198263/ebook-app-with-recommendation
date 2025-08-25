import api from './api';

// Service cho các chức năng liên quan đến danh mục
const categoryService = {
  // Lấy tất cả danh mục
  getAllCategories: async (showAll = false) => {
    try {
      const response = await api.get('/categories', {
        params: { showAll }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Lấy chi tiết danh mục theo ID hoặc slug
  getCategoryDetail: async (idOrSlug) => {
    try {
      const response = await api.get(`/categories/${idOrSlug}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Tạo danh mục mới
  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Cập nhật danh mục
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Xóa danh mục
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Thay đổi trạng thái hiển thị của danh mục
  toggleCategoryStatus: async (id) => {
    try {
      const response = await api.patch(`/categories/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Lấy danh sách ngắn gọn danh mục (chỉ _id và name) cho dropdown
  getCategoriesList: async () => {
    try {
      const response = await api.get('/categories/list');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Lấy danh sách danh mục cho trang sản phẩm (bao gồm _id, name, slug)
  getProductCategories: async () => {
    try {
      const response = await api.get('/categories/product-categories');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default categoryService;
