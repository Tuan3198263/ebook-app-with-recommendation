import Order from '../models/order.js';
import EbookLicense from '../models/ebookLicense.js';
import vnpayService from '../config/vnpayConfig.js';
import moment from 'moment';
import { createEbookLicense } from './licenseController.js';
import User from '../models/user.js';
import emailService from '../services/emailService.js';

/**
 * ==============================================
 * 🚨 THAY ĐỔI QUAN TRỌNG CHO LOCALHOST 🚨
 * ==============================================
 * 
 * ĐÃ CHUYỂN LOGIC TẠO BẢN QUYỀN SANG RETURN URL
 * 
 * Lý do: Localhost không thể nhận IPN từ VNPay
 * 
 * *** CHẾ ĐỘ HIỆN TẠI (LOCALHOST) ***
 * - Return URL: CHÍNH THỨC tạo bản quyền
 * - IPN: Backup (nếu được gọi)
 * 
 * *** KHI DEPLOY PRODUCTION ***
 * TODO: Đổi lại vai trò:
 * - IPN: CHÍNH THỨC tạo bản quyền
 * - Return URL: Backup
 * 
 * Cách thay đổi khi deploy:
 * 1. Trong vnpayReturn: Đổi createEbookLicense(order._id, false) -> createEbookLicense(order._id, true)
 * 2. Trong vnpayIpn: Đổi createEbookLicense(order._id, true) -> createEbookLicense(order._id, false)
 * 3. Cập nhật log từ [RETURN OFFICIAL] -> [RETURN BACKUP] và [IPN BACKUP] -> [IPN OFFICIAL]
 * ==============================================
 */

/**
 * ==============================================
 * QUAN TRỌNG: Sự khác biệt giữa Return URL và IPN
 * ==============================================
 * 
 * *** CHẾ ĐỘ LOCALHOST (HIỆN TẠI) ***
 * 
 * Return URL (vnpayReturn) - CHÍNH THỨC:
 * - Được gọi khi người dùng quay lại từ trang thanh toán VNPay
 * - CHÍNH THỨC cập nhật trạng thái giao dịch và tạo bản quyền (vì IPN không thể gọi được localhost)
 * - Đảm bảo người dùng có được bản quyền ngay lập tức
 * 
 * IPN (vnpayIpn) - BACKUP:
 * - Làm backup trong trường hợp Return URL có vấn đề
 * - Chỉ tạo bản quyền nếu Return URL chưa tạo
 * 
 * *** KHI DEPLOY PRODUCTION ***
 * - Nên đổi lại: IPN làm chính thức, Return URL làm backup
 * - IPN có độ tin cậy cao hơn, có cơ chế retry
 * ==============================================
 */

/**
 * Xử lý kết quả thanh toán khi người dùng được chuyển hướng về từ VNPay
 * @route GET /api/payment/vnpay-return
 */
export const vnpayReturn = async (req, res) => {
    try {
        console.log('=== VNPay RETURN URL CALLBACK ===');
        
        // Lấy parameters từ query (GET) hoặc body (POST)
        const params = req.method === 'GET' ? req.query : req.body;
        
        if (!params || Object.keys(params).length === 0) {
            console.error('=== KHÔNG CÓ PARAMETERS NÀO ===');
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/payment/result?success=false&code=98&message=${encodeURIComponent('Không nhận được dữ liệu từ VNPay')}`);
        }        
        console.log('=== PROCESSING PARAMETERS ===');
        
        // Xác thực checksum - CHỈ KIỂM TRA TOÀN VẸN DỮ LIỆU
        const isValid = vnpayService.verifyReturnUrl(params);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        if (!isValid) {
            console.warn('=== CHỮ KÝ KHÔNG HỢP LỆ ===');
            // Chuyển hướng với mã lỗi 97 (checksum fail)
            return res.redirect(`${frontendUrl}/payment/result?success=false&code=97&message=${encodeURIComponent('Xác thực dữ liệu thất bại')}`);
        }

        // Lấy thông tin từ Return URL
        const responseCode = params.vnp_ResponseCode;
        const transactionStatus = params.vnp_TransactionStatus;
        const orderId = params.vnp_TxnRef;
        const transactionNo = params.vnp_TransactionNo;        const amount = params.vnp_Amount;
        const bankCode = params.vnp_BankCode;
        
        console.log('Return URL Data:', {
            orderId,
            responseCode,
            transactionStatus,
            isSuccess: responseCode === '00' && transactionStatus === '00'
        });
          // Kiểm tra kết quả thanh toán dựa trên ResponseCode và TransactionStatus
        // ResponseCode = 00 và TransactionStatus = 00: Giao dịch thành công
        const isSuccess = responseCode === '00' && transactionStatus === '00';          if (isSuccess) {
            console.log('=== THANH TOÁN THÀNH CÔNG ===', {
                orderId,
                transactionNo
            });

            // CHÍNH THỨC: Cập nhật database trong Return URL (localhost không thể gọi IPN)
            try {
                const order = await Order.findOne({ orderCode: orderId });
                if (order && order.orderStatus === 'pending') {
                    order.orderStatus = 'completed'; // Ebook giao ngay lập tức
                    order.paymentDetails = {
                        transactionId: transactionNo,
                        bankCode: bankCode,
                        bankTranNo: params.vnp_BankTranNo,
                        cardType: params.vnp_CardType,
                        payDate: params.vnp_PayDate,
                        responseCode: responseCode,
                        transactionStatus: transactionStatus,
                        amount: parseInt(amount) / 100
                    };

                    await order.save();
                    console.log(`✅ [RETURN OFFICIAL] Đã cập nhật đơn hàng ${orderId} thành 'completed'`);
                      // CHÍNH THỨC: Tạo bản quyền ebook (Return URL là nơi chính thức cho localhost)
                    console.log(`🔄 [RETURN OFFICIAL] Bắt đầu tạo bản quyền cho đơn hàng ${orderId}`);
                    const licenseResult = await createEbookLicense(order._id, false); // false = chính thức
                    if (licenseResult.success) {
                        console.log(`🔑 [RETURN OFFICIAL] Đã tạo ${licenseResult.licenses.length} bản quyền ebook chính thức`);
                        
                        // Gửi email xác nhận đơn hàng
                        await sendOrderConfirmationEmail(order._id, 'RETURN_URL');
                    } else {
                        console.error(`❌ [RETURN OFFICIAL] Lỗi tạo bản quyền: ${licenseResult.error}`);
                    }
                } else if (order && order.orderStatus === 'completed') {
                    console.log(`ℹ️ [RETURN SKIP] Đơn hàng ${orderId} đã được xử lý trước đó`);
                } else if (!order) {
                    console.error(`❌ [RETURN ERROR] Không tìm thấy đơn hàng ${orderId}`);
                }
            } catch (dbError) {
                console.error('❌ [RETURN ERROR] Lỗi khi cập nhật database trong Return URL:', dbError);
            }
  
            
            // Chuyển hướng về frontend với thông tin thành công
            return res.redirect(`${frontendUrl}/payment/result?success=true&code=${responseCode}&orderCode=${orderId}&transactionId=${transactionNo}&amount=${amount}&bankCode=${bankCode}`);
        } else {
            console.warn('=== THANH TOÁN THẤT BẠI ===', {
                orderId,
                responseCode,
                transactionStatus
            });
            
            // Chuyển hướng về frontend với thông tin thất bại
            return res.redirect(`${frontendUrl}/payment/result?success=false&code=${responseCode}&orderCode=${orderId}&message=${encodeURIComponent('Thanh toán không thành công')}`);
        }
        
    } catch (error) {
        console.error('=== LỖI TRONG VNPay RETURN ===', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/payment/result?success=false&code=99&message=${encodeURIComponent('Lỗi xử lý dữ liệu')}`);
    }
};

/**
 * Xử lý thông báo thanh toán tức thì (IPN) từ VNPay
 * @route GET /api/payment/vnpay-ipn
 */
export const vnpayIpn = async (req, res) => {
    try {
        console.log('=== VNPay IPN CALLBACK ===');
        
        // Lấy parameters từ query (GET) hoặc body (POST)
        const params = req.method === 'GET' ? req.query : req.body;
        
        if (!params || Object.keys(params).length === 0) {
            console.error('=== IPN: KHÔNG CÓ PARAMETERS NÀO ===');
            return res.status(200).json({ RspCode: '99', Message: 'No parameters received' });
        }
        
        // Xác thực IPN - Bắt buộc phải kiểm tra trước tiên
        const ipnResult = vnpayService.verifyIpnCall(params);
          if (!ipnResult.isValid) {
            console.warn('Chữ ký IPN không hợp lệ');
            return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
        }
        
        // Lấy thông tin từ IPN
        const orderId = params.vnp_TxnRef;
        const rspCode = params.vnp_ResponseCode;
        const transactionStatus = params.vnp_TransactionStatus;
        const amount = parseInt(params.vnp_Amount) / 100; // VNPay trả về số tiền đã nhân 100
        const transactionNo = params.vnp_TransactionNo;
        const bankCode = params.vnp_BankCode;
        const payDate = params.vnp_PayDate;
        
        console.log('IPN Data:', {
            orderId,
            rspCode,
            transactionStatus,
            isSuccess: rspCode === '00' && transactionStatus === '00'
        });
        
        // Tìm đơn hàng trong database
        const order = await Order.findOne({ orderCode: orderId });
        
        if (!order) {
            console.error(`Không tìm thấy đơn hàng: ${orderId}`);
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }
        
        // Kiểm tra số tiền
        if (order.totalAmount !== amount) {
            console.error(`Số tiền không khớp. DB: ${order.totalAmount}, VNPay: ${amount}`);
            return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        }        // Kiểm tra đơn hàng đã được xử lý chưa
        if (order.orderStatus === 'completed') {
            console.log(`Đơn hàng ${orderId} đã được xử lý trước đó`);
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }        // Cập nhật trạng thái đơn hàng dựa trên ResponseCode và TransactionStatus
        // ResponseCode = 00 và TransactionStatus = 00: Giao dịch thành công
        if (rspCode === '00' && transactionStatus === '00') {
            // BACKUP: Kiểm tra xem Return URL đã xử lý chưa
            if (order.orderStatus === 'completed') {
                console.log(`ℹ️ [IPN SKIP] Đơn hàng ${orderId} đã được Return URL xử lý chính thức`);
                return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed by Return URL' });
            }

            // Cập nhật trạng thái thành công (backup cho trường hợp Return URL thất bại)
            order.orderStatus = 'completed'; // Ebook giao ngay lập tức sau khi thanh toán
            
            // Lưu chi tiết thanh toán
            order.paymentDetails = {
                transactionId: transactionNo,
                bankCode: bankCode,
                bankTranNo: params.vnp_BankTranNo,
                cardType: params.vnp_CardType,
                payDate: payDate,
                responseCode: rspCode,
                transactionStatus: transactionStatus,
                amount: amount
            };

            await order.save();
            console.log(`✅ [IPN BACKUP] Đơn hàng ${orderId} thanh toán thành công - orderStatus: 'completed' (backup)`);

            // BACKUP: Chỉ tạo bản quyền nếu Return URL chưa tạo
            const existingLicenses = await EbookLicense.countDocuments({
                order: order._id
            });

            if (existingLicenses === 0) {
                console.log(`🔄 [IPN BACKUP] Return URL chưa tạo bản quyền, thực hiện backup cho đơn hàng ${orderId}`);
                const licenseResult = await createEbookLicense(order._id, true); // true = backup
                if (licenseResult.success) {
                    console.log(`🔑 [IPN BACKUP] Đã tạo ${licenseResult.licenses.length} bản quyền ebook (backup)`);
                } else {
                    console.error(`❌ [IPN BACKUP] Lỗi tạo bản quyền: ${licenseResult.error}`);
                }
            } else {
                console.log(`ℹ️ [IPN SKIP] Return URL đã tạo ${existingLicenses} bản quyền cho đơn hàng ${orderId}, bỏ qua backup`);
            }
            
            // Gửi email xác nhận đơn hàng
            try {
                const emailResult = await sendOrderConfirmationEmail(orderId, 'IPN');
                
                if (emailResult.success) {
                    console.log(`📧 [IPN EMAIL] Đã gửi email xác nhận đơn hàng ${orderId} thành công`);
                } else {
                    console.error(`❌ [IPN EMAIL] Lỗi khi gửi email: ${emailResult.error}`);
                }
            } catch (emailError) {
                console.error('❌ [IPN EMAIL] Lỗi khi xử lý gửi email:', emailError.message);
                // Không ảnh hưởng đến luồng xử lý IPN nếu gửi email thất bại
            }
            
            return res.status(200).json({ RspCode: '00', Message: 'Success' });        } else {
            // Giao dịch thất bại
            order.orderStatus = 'failed'; // Thanh toán thất bại
            
            order.paymentDetails = {
                transactionId: transactionNo,
                bankCode: bankCode,
                responseCode: rspCode,
                transactionStatus: transactionStatus,
                responseMessage: `Payment failed with code: ${rspCode}`,
                amount: amount
            };
            
            await order.save();
            console.log(`❌ [IPN BACKUP] Đơn hàng ${orderId} thanh toán thất bại - ResponseCode: ${rspCode} (backup)`);
            
            // Trả về thành công cho VNPay (đã xử lý được IPN)
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        }
        
    } catch (error) {
        console.error('=== LỖI TRONG VNPay IPN ===', error);
        // Trả về lỗi 99 để VNPay retry IPN
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

/**
 * Truy vấn thông tin giao dịch từ VNPay
 * @route POST /api/payment/query-transaction
 */
export const queryTransaction = async (req, res) => {
    try {
        const { orderId, transactionId } = req.body;

        if (!orderId && !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã đơn hàng hoặc mã giao dịch'
            });
        }

        const ipAddr = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                      '127.0.0.1';
        
        // Truy vấn giao dịch từ VNPay
        const queryParams = {
            vnp_TxnRef: orderId,
            vnp_TransactionNo: transactionId || '',
            vnp_OrderInfo: `Truy van GD ma ${orderId}`,
            vnp_TransactionDate: moment().format('YYYYMMDD'),
            vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
            vnp_IpAddr: ipAddr
        };

        const queryResult = await vnpayService.queryTransaction(queryParams);
        
        if (queryResult.vnp_ResponseCode === '00') {
            return res.status(200).json({
                success: true,
                message: 'Truy vấn giao dịch thành công',
                data: queryResult
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Truy vấn giao dịch thất bại',
                code: queryResult.vnp_ResponseCode
            });
        }
        
    } catch (error) {
        console.error('Lỗi khi truy vấn giao dịch:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi truy vấn giao dịch',
            error: error.message
        });
    }
};

/**
 * Gửi email xác nhận đơn hàng
 * @param {string} orderId - ID đơn hàng
 * @param {string} source - Nguồn gọi hàm (IPN hoặc RETURN)
 */
const sendOrderConfirmationEmail = async (orderId, source = 'SYSTEM') => {
    try {
        console.log(`📧 [${source}] Bắt đầu gửi email xác nhận cho đơn hàng: ${orderId}`);
        
        // Lấy thông tin đơn hàng với populate items
        const order = await Order.findById(orderId).populate('items.book');
        
        if (!order) {
            console.error(`❌ [${source}] Không tìm thấy đơn hàng ${orderId} để gửi email`);
            return { success: false, error: 'Đơn hàng không tồn tại' };
        }
        
        // Lấy thông tin người dùng
        const user = await User.findById(order.user);
        
        if (!user) {
            console.error(`❌ [${source}] Không tìm thấy thông tin người dùng cho đơn hàng ${orderId}`);
            return { success: false, error: 'Người dùng không tồn tại' };
        }
        
        // Gửi email
        const emailResult = await emailService.sendOrderConfirmationEmail(order, user);
        
        if (emailResult.success) {
            console.log(`✅ [${source}] Đã gửi email xác nhận đơn hàng ${orderId} thành công`);
        } else {
            console.error(`❌ [${source}] Lỗi khi gửi email: ${emailResult.error}`);
        }
        
        return emailResult;
    } catch (error) {
        console.error(`❌ [${source}] Lỗi khi xử lý gửi email:`, error.message);
        return { success: false, error: error.message };
    }
};
