import api from './api.js';

/**
 * Bookmark Service - Quản lý bookmark trong sách
 */
class BookmarkService {
  
  /**
   * Lấy danh sách bookmark của user cho một cuốn sách
   * @param {string} bookId - ID của cuốn sách
   * @returns {Promise} Promise với danh sách bookmark
   */
  async getBookmarks(bookId) {
    try {
      console.log('📖 Getting bookmarks for book:', bookId);
      
      const response = await api.get(`/books/${bookId}/bookmarks`);
      
      console.log('📖 Bookmarks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting bookmarks:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Tạo bookmark mới
   * @param {string} bookId - ID của cuốn sách
   * @param {object} bookmarkData - Dữ liệu bookmark
   * @param {string} bookmarkData.cfi - Vị trí CFI trong sách
   * @param {string} bookmarkData.title - Tiêu đề bookmark
   * @returns {Promise} Promise với bookmark được tạo
   */
  async createBookmark(bookId, bookmarkData) {
    try {
      console.log('📝 Creating bookmark:', { bookId, bookmarkData });
      
      const response = await api.post(`/books/${bookId}/bookmarks`, bookmarkData);
      
      console.log('📝 Bookmark created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating bookmark:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cập nhật bookmark
   * @param {string} bookmarkId - ID của bookmark
   * @param {object} updateData - Dữ liệu cập nhật
   * @param {string} updateData.title - Tiêu đề mới
   * @returns {Promise} Promise với bookmark đã cập nhật
   */
  async updateBookmark(bookmarkId, updateData) {
    try {
      console.log('✏️ Updating bookmark:', { bookmarkId, updateData });
      
      const response = await api.put(`/bookmarks/${bookmarkId}`, updateData);
      
      console.log('✏️ Bookmark updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating bookmark:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Xóa bookmark
   * @param {string} bookmarkId - ID của bookmark
   * @returns {Promise} Promise với kết quả xóa
   */
  async deleteBookmark(bookmarkId) {
    try {
      console.log('🗑️ Deleting bookmark:', bookmarkId);
      
      const response = await api.delete(`/bookmarks/${bookmarkId}`);
      
      console.log('🗑️ Bookmark deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting bookmark:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Xóa tất cả bookmark của user cho một cuốn sách
   * @param {string} bookId - ID của cuốn sách
   * @returns {Promise} Promise với kết quả xóa
   */
  async deleteAllBookmarks(bookId) {
    try {
      console.log('🗑️ Deleting all bookmarks for book:', bookId);
      
      const response = await api.delete(`/books/${bookId}/bookmarks`);
      
      console.log('🗑️ All bookmarks deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting all bookmarks:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Lấy tất cả bookmark của user (across all books)
   * @param {object} options - Tùy chọn pagination
   * @param {number} options.page - Trang hiện tại
   * @param {number} options.limit - Số lượng bookmark per page
   * @returns {Promise} Promise với danh sách bookmark và pagination info
   */
  async getAllUserBookmarks(options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      console.log('📚 Getting all user bookmarks:', { page, limit });
      
      const response = await api.get('/bookmarks', {
        params: { page, limit }
      });
      
      console.log('📚 All bookmarks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting all bookmarks:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Kiểm tra bookmark đã tồn tại tại vị trí CFI chưa
   * @param {Array} bookmarks - Danh sách bookmark hiện tại
   * @param {string} cfi - CFI cần kiểm tra
   * @returns {boolean} True nếu bookmark đã tồn tại
   */
  isBookmarkExists(bookmarks, cfi) {
    return bookmarks.some(bookmark => bookmark.cfi === cfi);
  }

  /**
   * Tìm bookmark tại vị trí CFI
   * @param {Array} bookmarks - Danh sách bookmark
   * @param {string} cfi - CFI cần tìm
   * @returns {object|null} Bookmark tìm thấy hoặc null
   */
  findBookmarkByCfi(bookmarks, cfi) {
    return bookmarks.find(bookmark => bookmark.cfi === cfi) || null;
  }

  /**
   * Format bookmark để hiển thị
   * @param {object} bookmark - Bookmark object
   * @returns {object} Formatted bookmark
   */
  formatBookmark(bookmark) {
    return {
      id: bookmark.id || bookmark._id,
      title: bookmark.title,
      cfi: bookmark.cfi,
      createdAt: bookmark.createdAt,
      // Format date for display
      displayDate: this.formatDate(bookmark.createdAt)
    };
  }

  /**
   * Format date cho display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Validate bookmark data
   * @param {object} bookmarkData - Bookmark data to validate
   * @returns {object} Validation result
   */
  validateBookmarkData(bookmarkData) {
    const errors = [];

    if (!bookmarkData.cfi || typeof bookmarkData.cfi !== 'string') {
      errors.push('CFI là bắt buộc và phải là string');
    }

    if (!bookmarkData.title || typeof bookmarkData.title !== 'string') {
      errors.push('Tiêu đề là bắt buộc và phải là string');
    }

    if (bookmarkData.title && bookmarkData.title.length > 100) {
      errors.push('Tiêu đề không được vượt quá 100 ký tự');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @returns {Error} Processed error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Lỗi từ server';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Lỗi kết nối mạng');
    } else {
      // Other error
      return new Error(error.message || 'Lỗi không xác định');
    }
  }
}

// Export singleton instance
const bookmarkService = new BookmarkService();
export default bookmarkService;
