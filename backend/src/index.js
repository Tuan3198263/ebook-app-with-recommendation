// ẩn tắt cả cánh báo
process.removeAllListeners('warning');
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

// Load biến môi trường từ file .env TRƯỚC KHI import các module khác
dotenv.config();

// In thông tin debug về biến môi trường
console.log("DB_URI trong index.js:", process.env.DB_URI ? "Exists" : "Not found");

// Sau khi đã nạp biến môi trường, mới import DB
import connectToDatabase from "./db.js";
// import { initSocketIO } from './utils/socketManager.js';  // Comment out Socket.IO import

// Import route
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import bookRoutes from './routes/bookRoutes.js'; // Thêm route cho sách
import addressRoutes from './routes/addressRoutes.js'; // Thêm route cho địa chỉ
import favoriteRoutes from './routes/favoriteRoutes.js'; // Thêm route cho yêu thích
import academicRoutes from './routes/academicRoutes.js'; // Thêm route cho dữ liệu học thuật

import cartRoutes from './routes/cartRoutes.js'; // Thêm route cho giỏ hàng
import recentlyViewedRoutes from './routes/recentlyViewedRoutes.js'; // Thêm route cho recently viewed
import paymentRoutes from './routes/paymentRoutes.js'; // Thêm route cho thanh toán
import licenseRoutes from './routes/licenseRoutes.js'; // Thêm route cho bản quyền ebook

import orderRoutes from './routes/orderRoutes.js'; // Thêm route cho đơn hàng
import reviewRoutes from './routes/reviewRoutes.js'; // Thêm route cho đánh giá sách
import readerRoutes from './routes/readerRoutes.js'; // Thêm route cho reader
import bookmarkRoutes from './routes/bookmarkRoutes.js'; // Thêm route cho bookmark
import noteRoutes from './routes/noteRoutes.js'; // Thêm route cho ghi chú
import recomendationRoutes from './routes/recomendationRoutes.js'; // Thêm route cho sách gợi ý

import dashBoardRoutes from './routes/dashboardRoutes.js'; // Thêm route cho dashboard


import userRoutes from './routes/userRoutes.js'; // Thêm route cho user
// Import scheduler
import { initOrderScheduler } from './utils/orderScheduler.js';

const app = express();

// Kết nối tới MongoDB
connectToDatabase();

// Middlewares - đặt trước tất cả các routes
app.use(express.json());  // Thay vì bodyParser.json()
app.use(cors()); // Cho phép cross-origin requests

// Đăng ký route
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/books', bookRoutes); // Đăng ký route sách
app.use('/api/addresses', addressRoutes); // Đăng ký route địa chỉ
app.use('/api/favorites', favoriteRoutes); // Đăng ký route yêu thích
app.use('/api/academic', academicRoutes); // Đăng ký route dữ liệu học thuật
app.use('/api/cart', cartRoutes); // Fix: Bỏ dấu chấm trước /api/cart
app.use('/api/recently-viewed', recentlyViewedRoutes); // Đăng ký route recently viewed
app.use('/api/payment', paymentRoutes); // Đăng ký route thanh toán
app.use('/api/licenses', licenseRoutes); // Đăng ký route bản quyền ebook

app.use('/api/orders', orderRoutes); // Đăng ký route đơn hàng
app.use('/api', reviewRoutes); // Đăng ký route đánh giá sách
app.use('/api/reader', readerRoutes); // Đăng ký route reader
app.use('/api', bookmarkRoutes); // Đăng ký route bookmark
app.use('/api', noteRoutes); // Đăng ký route ghi chú
app.use('/api/recomendation', recomendationRoutes); // Đăng ký route sách nổi bật

app.use('/api/users', userRoutes); // Đăng ký route user(admin)
app.use('/api/dashboard', dashBoardRoutes); // Đăng ký route dashboard

// Định nghĩa route mặc định
app.get("/", (req, res) => {
    res.send("Server is running!");
});



// Định nghĩa cổng
const PORT = process.env.PORT || 3000;

// Khởi động server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // Khởi tạo scheduler kiểm tra đơn hàng hết hạn
    initOrderScheduler();
});

// Comment out Socket.IO initialization
/*
// Khởi tạo Socket.IO
const io = initSocketIO(server);

// Chạy listener để lắng nghe sự kiện
require("./events/notificationListener.js"); 
*/

// Comment out SmeeIO client initialization
/*
(async () => {
    try {
        const { default: SmeeClient } = await import('smee-client');
        
        const smee = new SmeeClient({
            source: 'https://smee.io/DC5tmeYA0vSSFNIV',
            target: `http://localhost:${PORT}/api/order/webhook`,
            logger: console
        });
        
        smee.start();
        console.log('Smee client started successfully');
    } catch (error) {
        console.error('Failed to initialize Smee client:', error);
    }
})();
*/


