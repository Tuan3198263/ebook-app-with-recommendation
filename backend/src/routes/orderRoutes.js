import express from 'express';
import { 
    createOrder, 
    getUserOrders, 
    getOrderDetails, 
    cancelOrder,
    checkPaymentStatus,
    getAllOrders,
    getAdminOrderDetails,
    updateOrderStatus,
    deleteOrder
} from '../controllers/orderController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authMiddleware);

// Tạo đơn hàng mới từ giỏ hàng
router.post('/create', createOrder);

// Lấy danh sách đơn hàng của người dùng
router.get('/',  getUserOrders);

// Kiểm tra trạng thái thanh toán của đơn hàng
router.get('/check-payment-status/:orderCode', checkPaymentStatus);

// ====================== ADMIN ROUTES ======================
// Admin: Lấy danh sách tất cả đơn hàng
router.get('/admin', isAdmin, getAllOrders);

// Admin: Lấy chi tiết đơn hàng
router.get('/admin/:id', isAdmin, getAdminOrderDetails);

// Admin: Cập nhật trạng thái đơn hàng
router.put('/admin/:id/status', isAdmin, updateOrderStatus);

// Admin: Xóa đơn hàng (chỉ cho phép xóa đơn hàng canceled)
router.delete('/admin/:id', isAdmin, deleteOrder);

// ====================== USER ROUTES ======================
// Lấy thông tin chi tiết đơn hàng
router.get('/:id',  getOrderDetails);

// Hủy đơn hàng
router.put('/:id/cancel',  cancelOrder);

export default router;
