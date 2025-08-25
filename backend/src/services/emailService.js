// src/services/emailService.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import moment from 'moment';
import transporter from '../config/emailConfig.js';

// Tạo __dirname tương thích với ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Đọc template email từ file
 * @param {string} templateName - Tên file template (không bao gồm đường dẫn)
 * @returns {string} Nội dung template
 */
const getEmailTemplate = (templateName) => {
    const templatePath = path.join(__dirname, '../templates/email', templateName);
    return fs.readFileSync(templatePath, 'utf-8');
};

/**
 * Format số tiền theo định dạng Việt Nam
 * @param {number} amount - Số tiền cần format
 * @returns {string} Số tiền đã được format
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Chuyển đổi mã thời hạn sang dạng văn bản tiếng Việt
 * @param {string} durationCode - Mã thời hạn ('1_month', '3_months', '6_months', 'permanent')
 * @returns {string} Văn bản thời hạn
 */
const formatDuration = (durationCode) => {
    switch (durationCode) {
        case '1_month':
            return '1 tháng';
        case '3_months':
            return '3 tháng';
        case '6_months':
            return '6 tháng';
        case 'permanent':
            return 'Vĩnh viễn';
        default:
            return durationCode;
    }
};

/**
 * Gửi email xác nhận đơn hàng sau khi thanh toán thành công
 * @param {Object} order - Thông tin đơn hàng
 * @param {Object} user - Thông tin người dùng
 * @returns {Promise<Object>} Kết quả gửi email
 */
export const sendOrderConfirmationEmail = async (order, user) => {
    try {
        console.log('🚀 Bắt đầu gửi email xác nhận đơn hàng:', order.orderCode);
        
        // Đọc template
        const templateSource = getEmailTemplate('orderConfirmation.html');
        const template = Handlebars.compile(templateSource);
        
        // Chuẩn bị dữ liệu cho template
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const orderDetailsUrl = `${frontendUrl}/profile/orders/${order._id}`;
          // Format dữ liệu cho từng sản phẩm
        const formattedItems = order.items.map(item => {
            return {
                title: item.title,
                duration: formatDuration(item.ebookOption.duration),
                price: formatCurrency(item.ebookOption.price),
                coverImage: item.coverImage // Thêm ảnh bìa sách vào dữ liệu
            };
        });
        
        // Dữ liệu để render vào template
        const templateData = {
            userName: user.name,
            orderCode: order.orderCode,
            orderDate: moment(order.createdAt).format('DD/MM/YYYY HH:mm'),
            paymentMethod: order.paymentMethod === 'vnpay' ? 'VNPay' : 'Khác',
            items: formattedItems,
            totalAmount: formatCurrency(order.totalAmount),
            orderDetailsUrl,
            currentYear: new Date().getFullYear()
        };
        
        // Tạo nội dung email từ template
        const htmlContent = template(templateData);
        
        // Cấu hình email
        const mailOptions = {
            from: `"Cửa hàng Sách Điện tử" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Xác nhận đơn hàng #${order.orderCode}`,
            html: htmlContent
        };
        
        // Gửi email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email xác nhận đơn hàng đã được gửi:', info.messageId);
        
        return {
            success: true,
            messageId: info.messageId
        };
        
    } catch (error) {
        console.error('❌ Lỗi khi gửi email xác nhận đơn hàng:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export default {
    sendOrderConfirmationEmail
};
