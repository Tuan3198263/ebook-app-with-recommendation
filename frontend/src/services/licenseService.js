import api from './api';

const licenseService = {
  /**
   * Lấy danh sách bản quyền ebook của người dùng đang đăng nhập
   * @param {Object} params - Tham số truy vấn
   * @param {Number} params.page - Số trang (mặc định là 1)
   * @param {Number} params.limit - Số lượng bản ghi mỗi trang (mặc định là 6)   * @param {String} params.status - Trạng thái bản quyền (active, expired, suspended)
   * @returns {Promise} - Trả về danh sách bản quyền và thông tin phân trang
   */
  getUserEbookLicenses: async (params = {}) => {
    try {
      const response = await api.get('/licenses/my-ebooks', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bản quyền ebook:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra quyền truy cập ebook của người dùng
   * @param {String} bookId - ID của sách cần kiểm tra
   * @returns {Promise} - Trả về thông tin quyền truy cập 
   */
  checkEbookAccess: async (bookId) => {
    try {
      const response = await api.get(`/licenses/check-access/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi kiểm tra quyền truy cập ebook:', error);
      
      // Nếu là lỗi 403 (không có quyền), trả về response từ server
      if (error.response && error.response.status === 403) {
        return error.response.data;
      }
      
      // Các lỗi khác thì throw
      throw error;
    }
  },

  /**
   * Lấy chi tiết bản quyền dựa trên ID
   * @param {String} licenseId - ID của bản quyền
   * @returns {Promise} - Trả về thông tin chi tiết bản quyền
   */
  getLicenseDetails: async (licenseId) => {
    try {
      const response = await api.get(`/licenses/${licenseId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết bản quyền:', error);
      throw error;
    }
  },

  /**
   * [Admin] Lấy danh sách tất cả bản quyền
   * @param {Object} params - Tham số truy vấn
   * @param {Number} params.page - Số trang (mặc định là 1)
   * @param {Number} params.limit - Số lượng bản ghi mỗi trang (mặc định là 20)   * @param {String} params.status - Trạng thái bản quyền (active, expired, suspended)
   * @param {String} params.user - ID của người dùng cần lọc
   * @param {String} params.book - ID của sách cần lọc
   * @returns {Promise} - Trả về danh sách bản quyền và thông tin phân trang
   */
  getAllLicenses: async (params = {}) => {
    try {
      const response = await api.get('/licenses/admin/all', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tất cả bản quyền:', error);
      throw error;
    }
  },

  /**
   * [Admin] Tạm ngưng hoặc kích hoạt lại bản quyền
   * @param {String} licenseId - ID của bản quyền
   * @param {Object} data - Dữ liệu cần gửi
   * @param {String} data.action - Hành động 'suspend' hoặc 'unsuspend'
   * @param {String} data.reason - Lý do tạm ngưng (chỉ cần khi action = 'suspend')
   * @returns {Promise} - Trả về kết quả xử lý
   */
  toggleLicenseSuspend: async (licenseId, data) => {
    try {
      const response = await api.put(`/licenses/admin/${licenseId}/suspend`, data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái bản quyền:', error);
      throw error;
    }
  },

  /**
   * Định dạng thời gian hiệu lực bản quyền
   * @param {Object} license - Đối tượng bản quyền
   * @returns {String} - Chuỗi hiển thị thời gian hiệu lực
   */
  formatLicenseDuration: (license) => {
    if (!license) return '';

    if (license.licenseType.duration === 'permanent') {
      return 'Vĩnh viễn';
    }

    const remainingDays = license.daysRemaining || 0;
    
    // Hiển thị theo định dạng phù hợp
    switch(license.licenseType.duration) {
      case '1_month':
        return `1 tháng (còn ${remainingDays} ngày)`;
      case '3_months':
        return `3 tháng (còn ${remainingDays} ngày)`;
      case '6_months':
        return `6 tháng (còn ${remainingDays} ngày)`;
      default:
        return `Còn ${remainingDays} ngày`;
    }
  },

  /**
   * Lấy trạng thái hiển thị của bản quyền
   * @param {Object} license - Đối tượng bản quyền
   * @returns {Object} - Đối tượng chứa text và class cho hiển thị
   */
  getLicenseStatusDisplay: (license) => {
    if (!license) return { text: '', class: '' };    switch (license.status) {
      case 'active':
        return { text: 'Còn hiệu lực', class: 'text-success' };
      case 'expired':
        return { text: 'Đã hết hạn', class: 'text-danger' };
      case 'suspended':
        return { text: 'Tạm khóa', class: 'text-warning' };
      default:
        return { text: 'Không xác định', class: 'text-muted' };
    }
  }
};

export default licenseService;
