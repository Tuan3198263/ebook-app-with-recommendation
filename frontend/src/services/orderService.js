import api from './api';

// Service cho các chức năng liên quan đến đơn hàng
const orderService = {
  // Tạo đơn hàng mới từ giỏ hàng
  createOrder: async (note = '', redirectUrl = null) => {
    try {
      const response = await api.post('/orders/create', { 
        note,
        redirectUrl
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      
      if (error.response?.status === 400) {
        // Xử lý trường hợp giỏ hàng trống hoặc đã có 3 đơn hàng pending
        throw new Error(error.response.data.message || 'Không thể tạo đơn hàng');
      }
      if (error.response?.status === 401) {
        throw new Error('Bạn cần đăng nhập để tạo đơn hàng');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại sau.');
    }
  },
  
  // Lấy danh sách đơn hàng của người dùng (toàn bộ, không phân trang) - cải tiến
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders');
      
      // Đảm bảo dữ liệu trả về là đúng định dạng
      if (!response || !response.data || !Array.isArray(response.data.orders)) {
        return {
          success: false,
          orders: [],
          total: 0,
          message: 'Định dạng dữ liệu không hợp lệ'
        };
      }
      
      return {
        success: true,
        orders: response.data.orders || [],
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      
      // Xử lý lỗi đơn giản hóa
      const errorMessage = error.response?.data?.message || 
                          (error.response?.status === 401 ? 'Bạn cần đăng nhập để xem đơn hàng' : 
                          'Không thể lấy danh sách đơn hàng');
      
      return {
        success: false,
        orders: [],
        total: 0,
        message: errorMessage
      };
    }
  },
  // Lấy chi tiết đơn hàng - cải tiến để xử lý lỗi tốt hơn
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
      
      // Tạo thông báo lỗi có ý nghĩa
      let errorMessage = 'Không thể lấy chi tiết đơn hàng';
      
      if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy đơn hàng';
      } else if (error.response?.status === 401) {
        errorMessage = 'Bạn cần đăng nhập để xem chi tiết đơn hàng';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  },
  
  // Hủy đơn hàng - cải tiến để xử lý lỗi tốt hơn
  cancelOrder: async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      
      // Kiểm tra phản hồi từ server
      if (!response || !response.data || !response.data.success) {
        throw new Error(response?.data?.message || 'Không thể hủy đơn hàng');
      }
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error);
      
      // Đơn giản hóa xử lý lỗi
      const errorMessage = error.response?.data?.message || 'Không thể hủy đơn hàng';
      throw new Error(errorMessage);
    }
  },  // Kiểm tra trạng thái thanh toán của đơn hàng - cải tiến để xử lý lỗi tốt hơn
  checkPaymentStatus: async (orderId) => {
    try {
      const orderDetails = await orderService.getOrderDetails(orderId);
      
      if (!orderDetails || !orderDetails.success || !orderDetails.order) {
        return {
          success: false,
          isPaid: false,
          message: 'Không thể lấy thông tin đơn hàng'
        };
      }
      
      return {
        success: true,
        isPaid: orderDetails.order.orderStatus === 'completed',
        status: orderDetails.order.orderStatus,
        orderStatus: orderDetails.order.orderStatus,
        paymentDetails: orderDetails.order.paymentDetails || {}
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
      return {
        success: false,
        isPaid: false,
        message: error.message || 'Không thể kiểm tra trạng thái thanh toán'
      };
    }
  },

  // Xử lý kết quả thanh toán - cải tiến để xử lý lỗi tốt hơn
  processPaymentResult: async (paymentResult) => {
    try {
      // Đây là nơi xử lý kết quả sau khi người dùng thanh toán xong
      // Trong hầu hết các trường hợp, VNPay sẽ cập nhật trạng thái
      // đơn hàng qua IPN, nhưng ta vẫn cần cập nhật UI cho người dùng

      const { orderCode, success, code } = paymentResult;
      
      if (!orderCode) {
        throw new Error('Không tìm thấy mã đơn hàng');
      }

      // Lấy thông tin mới nhất của đơn hàng
      const orderDetails = await orderService.getOrderDetails(orderCode);
      
      if (!orderDetails || !orderDetails.success) {
        return {
          success: false,
          message: 'Không thể lấy thông tin đơn hàng'
        };
      }
      
      return {
        success: true,
        order: orderDetails.order,
        paymentSuccess: success,
        responseCode: code
      };
    } catch (error) {
      console.error('Lỗi khi xử lý kết quả thanh toán:', error);
      return {
        success: false,
        message: error.message || 'Lỗi khi xử lý kết quả thanh toán'
      };
    }
  }
};

// ====================== ADMIN METHODS ======================
const adminOrderService = {
  // Admin: Lấy danh sách tất cả đơn hàng
  getAllOrders: async () => {
    try {
      const response = await api.get('/orders/admin');
      
      if (!response || !response.data || !Array.isArray(response.data.orders)) {
        return {
          success: false,
          orders: [],
          stats: {},
          message: 'Định dạng dữ liệu không hợp lệ'
        };
      }
      
      return {
        success: true,
        orders: response.data.orders || [],
        stats: response.data.stats || {}
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng (Admin):', error);
      
      const errorMessage = error.response?.data?.message || 
                          (error.response?.status === 403 ? 'Không có quyền truy cập' : 
                          'Không thể lấy danh sách đơn hàng');
      
      return {
        success: false,
        orders: [],
        stats: {},
        message: errorMessage
      };
    }
  },

  // Admin: Lấy chi tiết đơn hàng
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/admin/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết đơn hàng (Admin):', error);
      
      let errorMessage = 'Không thể lấy chi tiết đơn hàng';
      
      if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy đơn hàng';
      } else if (error.response?.status === 403) {
        errorMessage = 'Không có quyền truy cập';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  },
  // Admin: Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, orderStatus) => {
    try {
      const response = await api.put(`/orders/admin/${orderId}/status`, {
        orderStatus
      });
      
      if (!response || !response.data || !response.data.success) {
        throw new Error(response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
      }
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng';
      throw new Error(errorMessage);
    }
  },

  // Admin: Xóa đơn hàng
  deleteOrder: async (orderId) => {
    try {
      const response = await api.delete(`/orders/admin/${orderId}`);
      
      if (!response || !response.data || !response.data.success) {
        throw new Error(response?.data?.message || 'Không thể xóa đơn hàng');
      }
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa đơn hàng:', error);
      
      const errorMessage = error.response?.data?.message || 'Không thể xóa đơn hàng';
      throw new Error(errorMessage);
    }
  }
};

// Gộp tất cả các service lại
const fullOrderService = { ...orderService, admin: adminOrderService };

export default fullOrderService;
