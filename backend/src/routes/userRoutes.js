import express from 'express';
import { getAllUsers, getUserDetail, updateUserDetail } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Lấy danh sách user, tổng số user, thống kê theo faculty
router.get('/', authMiddleware, isAdmin, getAllUsers);

// Lấy chi tiết 1 user
router.get('/:id', authMiddleware, isAdmin, getUserDetail);

// Chỉnh sửa chi tiết 1 user
router.put('/:id', authMiddleware, isAdmin, updateUserDetail);

export default router;
