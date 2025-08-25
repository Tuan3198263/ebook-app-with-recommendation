import api from './api';

// Service cho các chức năng liên quan đến giỏ hàng
const cartService = {
  // Lấy giỏ hàng của user
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
      throw error;
    }
  },

  // Thêm sách vào giỏ hàng hoặc cập nhật giá thuê
  addToCart: async (bookId, duration, price) => {
    try {
      const response = await api.post('/cart/add', {
        bookId,
        duration,
        price
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thêm sách vào giỏ hàng:', error);
      throw error;
    }
  },

  // Cập nhật gói thuê của sách trong giỏ hàng
  updateCartItem: async (itemId, duration, price) => {
    try {
      const response = await api.put(`/cart/item/${itemId}`, {
        duration,
        price
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật giỏ hàng:', error);
      throw error;
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeFromCart: async (itemId) => {
    try {
      const response = await api.delete(`/cart/item/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
      throw error;
    }
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async () => {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa toàn bộ giỏ hàng:', error);
      throw error;
    }
  },

  // Thêm nhiều sách vào giỏ hàng cùng lúc
  addMultipleToCart: async (items) => {
    try {
      const promises = items.map(item => 
        cartService.addToCart(item.bookId, item.duration, item.price)
      );
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Lỗi khi thêm nhiều sách vào giỏ hàng:', error);
      throw error;
    }
  },

  // Kiểm tra xem sách có trong giỏ hàng không
  isBookInCart: async (bookId) => {
    try {
      const cartData = await cartService.getCart();
      const cart = cartData.data?.cart;
      
      if (!cart || !cart.items) {
        return false;
      }
      
      return cart.items.some(item => 
        item.book && item.book._id === bookId
      );
    } catch (error) {
      console.error('Lỗi khi kiểm tra sách trong giỏ hàng:', error);
      return false;
    }
  },

  // Lấy thông tin gói thuê hiện tại của sách trong giỏ hàng
  getBookEbookOption: async (bookId) => {
    try {
      const cartData = await cartService.getCart();
      const cart = cartData.data?.cart;
      
      if (!cart || !cart.items) {
        return null;
      }
      
      const item = cart.items.find(item => 
        item.book && item.book._id === bookId
      );
      return item ? item.ebookOption : null;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin gói thuê:', error);
      return null;
    }
  }
};

export default cartService;
