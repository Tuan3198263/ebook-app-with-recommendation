import express from 'express';
import {
  toggleFavorite,
  checkFavoriteStatus,
  getFavoriteBooks,
  removeFavorite
} from '../controllers/favoriteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authMiddleware);

// Route toggle thêm/xóa khỏi yêu thích
router.post('/toggle', toggleFavorite);

// Route kiểm tra trạng thái yêu thích của sách
router.get('/check/:bookId', checkFavoriteStatus);

// Route lấy danh sách sách yêu thích
router.get('/', getFavoriteBooks);

// Route xóa một sách khỏi danh sách yêu thích
router.delete('/:bookId', removeFavorite);

export default router;
