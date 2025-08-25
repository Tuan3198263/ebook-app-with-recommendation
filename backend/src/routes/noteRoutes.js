import express from 'express';
const router = express.Router();
import noteController from '../controllers/noteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Routes cho ghi chú theo sách
// GET /api/books/:bookId/notes - Lấy danh sách ghi chú của user trong một cuốn sách
router.get('/books/:bookId/notes', authMiddleware, noteController.getNotes);

// POST /api/books/:bookId/notes - Tạo ghi chú mới trong cuốn sách
router.post('/books/:bookId/notes', authMiddleware, noteController.createNote);

// DELETE /api/books/:bookId/notes - Xóa tất cả ghi chú của user trong cuốn sách
router.delete('/books/:bookId/notes', authMiddleware, noteController.deleteAllNotes);

// Routes cho ghi chú cụ thể
// GET /api/notes/:noteId - Lấy thông tin chi tiết một ghi chú
router.get('/notes/:noteId', authMiddleware, noteController.getNoteById);

// PUT /api/notes/:noteId - Cập nhật ghi chú
router.put('/notes/:noteId', authMiddleware, noteController.updateNote);

// DELETE /api/notes/:noteId - Xóa một ghi chú
router.delete('/notes/:noteId', authMiddleware, noteController.deleteNote);

export default router;
