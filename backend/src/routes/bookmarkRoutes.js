import { Router } from 'express';
import {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  getAllUserBookmarks,
  deleteAllBookmarks
} from '../controllers/bookmarkController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Tất cả routes đều cần authentication → giờ mình thêm middleware vào từng route

// Routes cho bookmark của một cuốn sách cụ thể
// GET /api/books/:bookId/bookmarks - Lấy tất cả bookmark của user trong một cuốn sách
router.get('/books/:bookId/bookmarks', authMiddleware, getBookmarks);

// POST /api/books/:bookId/bookmarks - Tạo bookmark mới trong một cuốn sách
router.post('/books/:bookId/bookmarks', authMiddleware, createBookmark);

// DELETE /api/books/:bookId/bookmarks - Xóa tất cả bookmark của user trong một cuốn sách
router.delete('/books/:bookId/bookmarks', authMiddleware, deleteAllBookmarks);

// Routes cho bookmark cụ thể
// PUT /api/bookmarks/:id - Cập nhật bookmark (title)
router.put('/bookmarks/:id', authMiddleware, updateBookmark);

// DELETE /api/bookmarks/:id - Xóa bookmark
router.delete('/bookmarks/:id', authMiddleware, deleteBookmark);

// Routes cho tất cả bookmark của user
// GET /api/bookmarks - Lấy tất cả bookmark của user (across all books)
router.get('/bookmarks', authMiddleware, getAllUserBookmarks);

export default router;
