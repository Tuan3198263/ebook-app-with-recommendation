import express from 'express';
import {
    getUserEbookLicenses,
    checkEbookAccess,
    getLicenseDetails,
    getAllLicenses,
    toggleLicenseSuspend
} from '../controllers/licenseController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Routes cho người dùng thường
router.use(authMiddleware); // Tất cả routes cần đăng nhập

// Lấy danh sách bản quyền ebook của người dùng
router.get('/my-ebooks', getUserEbookLicenses);

// Kiểm tra quyền truy cập ebook
router.get('/check-access/:bookId', checkEbookAccess);

// Lấy chi tiết bản quyền
router.get('/:licenseId', getLicenseDetails);

// Routes cho admin
router.get('/admin/all', isAdmin, getAllLicenses);
router.put('/admin/:licenseId/suspend', isAdmin, toggleLicenseSuspend);

export default router;
