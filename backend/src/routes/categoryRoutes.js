import express from 'express';
import { 
  getAllCategories, 
  getCategoryDetail, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  toggleCategoryStatus,
  getCategoriesList,
  getProductCategories
} from '../controllers/categoryController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Routes công khai
router.get('/', getAllCategories);
router.get('/list', getCategoriesList); // Thêm route lấy danh sách ngắn gọn
router.get('/product-categories', getProductCategories); // Route mới cho danh mục sản phẩm
router.get('/:idOrSlug', getCategoryDetail);

// Routes yêu cầu quyền admin
router.post('/', authMiddleware, isAdmin, createCategory);
router.put('/:id', authMiddleware, isAdmin, updateCategory);
router.delete('/:id', authMiddleware, isAdmin, deleteCategory);
router.patch('/:id/toggle-status', authMiddleware, isAdmin, toggleCategoryStatus);

export default router;
