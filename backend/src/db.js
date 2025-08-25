import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Tạo __dirname tương thích với ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Lấy URI từ biến môi trường
const uri = process.env.DB_URI;

// Kiểm tra URI trước khi kết nối
if (!uri) {
    console.error('❌ MongoDB URI không được định nghĩa trong file .env');
    process.exit(1);
}

async function connectToDatabase() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB successfully');
    } catch (err) {
        console.error('❌ Could not connect to MongoDB:', err.message);
        process.exit(1);
    }
}

export default connectToDatabase;
