import express from 'express';
import { getFeaturedBooks, getUserFacultyAndHistory, recommendBooks } from '../controllers/recomendationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/featured/books
 * @desc Lấy danh sách sách nổi bật cho cold-start users
 * @access Public (KHÔNG cần xác thực)
 */
router.get('/books', getFeaturedBooks); // KHÔNG dùng middleware xác thực

/**
 * @route GET /api/featured/user-info
 * @desc Lấy faculty và danh sách bookIds đã xem của user
 * @access Private (Cần xác thực)
 */
router.get('/user-info',authMiddleware, getUserFacultyAndHistory); // Cần middleware xác thực nếu muốn bảo vệ


router.get('/recommend',authMiddleware, recommendBooks);

router.get('/test-public', (req, res) => {
    res.json({ message: "✅ Route public hoạt động bình thường" });
});

export default router;
