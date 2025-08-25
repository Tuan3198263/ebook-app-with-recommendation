import express from 'express';
import { 
    vnpayReturn,
    vnpayIpn,
    queryTransaction,
} from '../controllers/vnpayController.js';

const router = express.Router();

// Route xử lý kết quả thanh toán từ VNPay - hỗ trợ cả GET và POST
router.get('/vnpay-return', vnpayReturn);
router.post('/vnpay-return', vnpayReturn);

// Route xử lý IPN (Instant Payment Notification) từ VNPay - hỗ trợ cả GET và POST  
router.get('/vnpay-ipn', vnpayIpn);
router.post('/vnpay-ipn', vnpayIpn);

// Route truy vấn thông tin giao dịch
router.post('/query-transaction', queryTransaction);

export default router;
