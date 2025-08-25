import express from 'express';
import {
  streamEbook,
  getReaderData,
  proxyEbook,
  getPdfDownloadUrl
} from '../controllers/readerController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(authMiddleware);

// Lấy thông tin để hiển thị trong reader
router.get('/data/:bookId', getReaderData);

// Stream file ebook (EPUB/PDF)
router.get('/stream/:bookId/:format', streamEbook);

// Proxy endpoint để serve file trực tiếp (chỉ EPUB)
router.get('/proxy/:bookId/:format', proxyEbook);

// Lấy URL tải xuống PDF
router.get('/pdf-download/:bookId', getPdfDownloadUrl);

export default router;
