import Order from '../models/order.js';
import mongoose from 'mongoose';

/**
 * Script migration để cập nhật schema Order từ 2 trường (paymentStatus + orderStatus) 
 * xuống 1 trường (chỉ orderStatus)
 * 
 * Chạy script này 1 lần duy nhất sau khi deploy code mới
 */

const migrateOrderSchema = async () => {
    try {
        console.log('🚀 Bắt đầu migration Order schema...');
        
        // Tìm tất cả đơn hàng có paymentStatus
        const ordersToMigrate = await Order.find({
            paymentStatus: { $exists: true }
        });
        
        console.log(`📊 Tìm thấy ${ordersToMigrate.length} đơn hàng cần migration`);
        
        if (ordersToMigrate.length === 0) {
            console.log('✅ Không có đơn hàng nào cần migration');
            return;
        }
        
        let migratedCount = 0;
        
        for (const order of ordersToMigrate) {
            let newOrderStatus = order.orderStatus;
            
            // Logic mapping từ paymentStatus sang orderStatus
            switch (order.paymentStatus) {
                case 'pending':
                    newOrderStatus = 'pending';
                    break;
                case 'completed':
                    newOrderStatus = 'completed';
                    break;
                case 'failed':
                    newOrderStatus = 'failed';
                    break;
                case 'canceled':
                    newOrderStatus = 'canceled';
                    break;
                case 'refunded':
                    newOrderStatus = 'refunded';
                    break;
                default:
                    newOrderStatus = order.orderStatus; // Giữ nguyên nếu không map được
            }
            
            // Cập nhật orderStatus và xóa paymentStatus
            await Order.updateOne(
                { _id: order._id },
                {
                    $set: { orderStatus: newOrderStatus },
                    $unset: { paymentStatus: 1 }
                }
            );
            
            migratedCount++;
        }
        
        console.log(`✅ Migration hoàn thành! Đã cập nhật ${migratedCount} đơn hàng`);
        
        // Kiểm tra kết quả
        const remainingOrders = await Order.find({
            paymentStatus: { $exists: true }
        });
        
        if (remainingOrders.length === 0) {
            console.log('🎉 Tất cả đơn hàng đã được migration thành công!');
        } else {
            console.warn(`⚠️  Còn ${remainingOrders.length} đơn hàng chưa được migration`);
        }
        
    } catch (error) {
        console.error('❌ Lỗi trong quá trình migration:', error);
        throw error;
    }
};

/**
 * Chạy migration nếu file này được chạy trực tiếp
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    // Kết nối database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luanvan');
    
    try {
        await migrateOrderSchema();
        console.log('✅ Migration script hoàn thành');
    } catch (error) {
        console.error('❌ Migration script thất bại:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

export default migrateOrderSchema;
