import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authMiddleware);

// Route lấy giỏ hàng của user
router.get('/', getCart);

// Route thêm sách vào giỏ hàng hoặc cập nhật giá thuê
router.post('/add', addToCart);

// Route cập nhật gói thuê của sách trong giỏ hàng
router.put('/item/:itemId', updateCartItem);

// Route xóa sản phẩm khỏi giỏ hàng
router.delete('/item/:itemId', removeFromCart);

// Route xóa toàn bộ giỏ hàng
router.delete('/clear', clearCart);

export default router;
