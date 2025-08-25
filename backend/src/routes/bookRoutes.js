import express from 'express';
import multer from 'multer';
import {
  createBook,
  getAllBooks,
  getBookDetail,
  getBookDetailById,
  updateBook,
  toggleBookStatus,
  toggleFeaturedStatus,
  getBooksByCategory,
  searchBooks
} from '../controllers/bookController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Cấu hình multer để xử lý multipart form data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes công khai
router.get('/', getAllBooks);
// Route tìm kiếm sách - đặt TRƯỚC các route có params để tránh xung đột
router.get('/search', searchBooks);
// Thêm route mới cho lấy sách theo danh mục - đặt TRƯỚC route /:slug để tránh xung đột
router.get('/by-category/:slug', getBooksByCategory);
// Route lấy chi tiết sách theo ID - đặt TRƯỚC route /:slug
router.get('/detail/:id', getBookDetailById);
router.get('/:slug', getBookDetail);

// Routes dành cho Admin
router.post('/', 
  authMiddleware, 
  isAdmin, 
  upload.fields([
    { name: 'coverImages', maxCount: 5 },  // Tối đa 5 ảnh bìa
    { name: 'epubFile', maxCount: 1 },     // 1 file EPUB
    { name: 'pdfFile', maxCount: 1 }       // 1 file PDF
  ]), 
  createBook
);

// Route cập nhật sách
router.put('/:id',
  authMiddleware,
  isAdmin,
  upload.fields([
    { name: 'coverImages', maxCount: 5 },  // Tối đa 5 ảnh bìa mới
    { name: 'epubFile', maxCount: 1 },     // File EPUB mới nếu cần cập nhật
    { name: 'pdfFile', maxCount: 1 }       // File PDF mới nếu cần cập nhật
  ]),
  updateBook
);

// Route chuyển đổi trạng thái hiển thị của sách
router.patch('/:id/toggle-status', 
  authMiddleware, 
  isAdmin, 
  toggleBookStatus
);

// Route chuyển đổi trạng thái nổi bật của sách
router.patch('/:id/toggle-featured', 
  authMiddleware, 
  isAdmin, 
  toggleFeaturedStatus
);

export default router;
