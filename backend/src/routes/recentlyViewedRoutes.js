import express from 'express';
import {
  addOrUpdateView,
  getRecentViews,
  getUserInteractions,
  removeFromHistory,
  clearHistory,
  cleanupSessionData
} from '../controllers/recentlyViewedController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for recently viewed functionality
router.post('/', authMiddleware, addOrUpdateView);                         // Thêm/cập nhật lịch sử xem (optional auth)
router.get('/', authMiddleware, getRecentViews);                           // Lấy lịch sử xem (require auth)
router.get('/interactions', authMiddleware, getUserInteractions);          // Lấy dữ liệu tương tác (optional auth) 
router.delete('/cleanup-sessions', authMiddleware, cleanupSessionData);    // Cleanup session data cũ (admin)
router.delete('/:bookId', authMiddleware, removeFromHistory);              // Xóa một sách khỏi lịch sử (optional auth)
router.delete('/', authMiddleware, clearHistory);                          // Xóa toàn bộ lịch sử (optional auth)

export default router;
