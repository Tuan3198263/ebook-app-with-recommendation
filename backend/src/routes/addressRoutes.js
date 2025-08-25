import express from 'express';
import {
  createOrUpdateAddress,
  getUserAddress,
} from '../controllers/addressController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authMiddleware);

// Route tạo/cập nhật địa chỉ của người dùng
router.post('/', createOrUpdateAddress);

// Route lấy địa chỉ của người dùng
router.get('/', getUserAddress);

export default router;
