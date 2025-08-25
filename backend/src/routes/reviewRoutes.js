import express from 'express';
import {
  createReview,
  deleteReview,
  getBookReviews,
  checkReviewEligibility
} from '../controllers/reviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router({ mergeParams: true });

// Cho phép sử dụng route /api/books/:bookId/reviews
// và route /api/reviews

// Lấy danh sách đánh giá của một sách
router.get('/books/:bookId/reviews', getBookReviews);

// Kiểm tra điều kiện để đánh giá sách
router.get('/books/:bookId/review-eligibility', authMiddleware, checkReviewEligibility);

// Tạo đánh giá mới (cần đăng nhập)
router.post('/books/:bookId/reviews', authMiddleware, createReview);

// Cập nhật đánh giá đã bị loại bỏ theo yêu cầu

// Xóa đánh giá (chỉ admin)
router.delete('/reviews/:id', authMiddleware, isAdmin, deleteReview);

export default router;
