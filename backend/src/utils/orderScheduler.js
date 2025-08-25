import { cancelExpiredOrders } from '../controllers/orderController.js';

// Khoảng thời gian kiểm tra đơn hàng hết hạn (5 phút = 300000 ms)
const CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * Khởi tạo scheduler để tự động hủy đơn hàng hết hạn
 */
export const initOrderScheduler = () => {
    console.log('Khởi tạo scheduler kiểm tra đơn hàng hết hạn...');
    
    // Thực hiện kiểm tra lần đầu sau 1 phút khởi động server
    setTimeout(() => {
        console.log('Chạy kiểm tra đơn hàng hết hạn lần đầu');
        runOrderCancellationTask();
        
        // Sau đó thiết lập kiểm tra định kỳ
        setInterval(runOrderCancellationTask, CHECK_INTERVAL);
    }, 60 * 1000);
    
    console.log(`Scheduler đã được thiết lập: kiểm tra mỗi ${CHECK_INTERVAL / 60000} phút`);
};

/**
 * Hàm thực hiện việc hủy đơn hàng
 */
const runOrderCancellationTask = async () => {
    try {
        console.log(`[${new Date().toISOString()}] Đang chạy tác vụ hủy đơn hàng hết hạn...`);
        const result = await cancelExpiredOrders();
        console.log(`Kết quả: ${result.success ? 'Thành công' : 'Thất bại'}, ${result.canceled || 0} đơn hàng đã bị hủy`);
    } catch (error) {
        console.error('Lỗi khi chạy tác vụ hủy đơn hàng:', error);
    }
};
