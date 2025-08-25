import api from './api';

const reviewService = {
  /**
   * Lấy danh sách đánh giá của một sách
   * @param {string} bookId ID của sách
   * @param {Object} params Tham số phân trang (page, limit, sort)
   * @returns {Promise} Danh sách đánh giá
   */  getBookReviews(bookId, params = {}) {
    const { sort = '-createdAt' } = params;
    return api.get(`/books/${bookId}/reviews`, {
      params: { sort }
    });
  },

  /**
   * Kiểm tra người dùng có đủ điều kiện đánh giá sách hay không
   * @param {string} bookId ID của sách
   * @returns {Promise} Kết quả kiểm tra
   */
  checkReviewEligibility(bookId) {
    return api.get(`/books/${bookId}/review-eligibility`);
  },

  /**
   * Tạo đánh giá mới cho sách
   * @param {string} bookId ID của sách
   * @param {Object} reviewData Dữ liệu đánh giá (rating, content)
   * @returns {Promise} Đánh giá đã tạo
   */
  createReview(bookId, reviewData) {
    return api.post(`/books/${bookId}/reviews`, reviewData);
  },
  /**
   * Chức năng cập nhật và xóa đánh giá đã bị loại bỏ theo yêu cầu
   * Chỉ admin có quyền xóa đánh giá thông qua giao diện admin
   */
};

export default reviewService;
