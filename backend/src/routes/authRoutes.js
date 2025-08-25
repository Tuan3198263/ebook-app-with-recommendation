import express from 'express';
import { register, login, updateProfile, updateAvatar, getProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../config/multerConfig.js';

const router = express.Router();

// Route đăng ký
router.post('/register', register);

// Route đăng nhập
router.post('/login', login);

// Route lấy thông tin cá nhân (yêu cầu xác thực)
router.get('/profile', authMiddleware, getProfile);

// Route cập nhật thông tin (yêu cầu xác thực)
router.put('/update-profile', authMiddleware, updateProfile);

// Route cập nhật ảnh đại diện (yêu cầu xác thực + upload file)
router.put('/update-avatar', authMiddleware, upload.single('avatar'), updateAvatar);

export default router;
