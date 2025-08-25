import express from 'express';
import {
  getAllAuthors,
  getAuthorDetail,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorsList,
  getAuthorsByCategory,
  getAuthorsByBookKeyword
} from '../controllers/authorController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Routes công khai - ai cũng có thể truy cập
router.get('/', getAllAuthors);
router.get('/list', getAuthorsList); // Thêm route lấy danh sách ngắn gọn
router.get('/by-category/:slug', getAuthorsByCategory); // Thêm route lấy tác giả theo danh mục
router.get('/by-book-keyword', getAuthorsByBookKeyword); // Thêm route lấy tác giả theo từ khóa sách
router.get('/:idOrSlug', getAuthorDetail);

// Routes dành cho Admin - yêu cầu đăng nhập và quyền Admin
router.post('/', authMiddleware, isAdmin, createAuthor);
router.put('/:id', authMiddleware, isAdmin, updateAuthor);
router.delete('/:id', authMiddleware, isAdmin, deleteAuthor);

export default router;
