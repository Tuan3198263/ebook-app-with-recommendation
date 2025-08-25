import EbookLicense from '../models/ebookLicense.js';
import Order from '../models/order.js';
import Book from '../models/book.js';
import User from '../models/user.js';
import mongoose from 'mongoose';

/**
 * Tạo bản quyền ebook khi đơn hàng thanh toán thành công
 * Được gọi tự động từ vnpayController
 */
export const createEbookLicense = async (orderIdentifier, isBackup = false) => {
    try {
        const logPrefix = isBackup ? '[BACKUP]' : '[OFFICIAL]';
        console.log(`🔑 ${logPrefix} Bắt đầu tạo bản quyền cho đơn hàng: ${orderIdentifier}`);
        
        // Tìm đơn hàng - có thể là ObjectId hoặc orderCode
        let order;
        if (mongoose.Types.ObjectId.isValid(orderIdentifier)) {
            // Là ObjectId
            order = await Order.findById(orderIdentifier).populate('user');
        } else {
            // Là orderCode
            order = await Order.findOne({ orderCode: orderIdentifier }).populate('user');
        }
        
        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }
        
        if (order.orderStatus !== 'completed') {
            throw new Error('Đơn hàng chưa hoàn thành');
        }
          const licenses = [];
        const skippedItems = [];        // Tạo hoặc gia hạn bản quyền cho từng sách trong đơn hàng
        for (const item of order.items) {
            // Kiểm tra đơn hàng hiện tại đã xử lý chưa (tránh trùng lặp khi gọi nhiều lần)
            const orderProcessedLicense = await EbookLicense.findOne({
                user: order.user._id,
                book: item.book,
                order: order._id
            });
              
            if (orderProcessedLicense) {
                if (!isBackup) {
                    console.log(`⚠️ Đơn hàng này đã được xử lý cho sách ${item.book}`);
                }
                skippedItems.push(item.book);
                continue;
            }

            // Kiểm tra xem người dùng đã có bản quyền nào cho sách này chưa
            const existingLicense = await EbookLicense.findOne({
                user: order.user._id,
                book: item.book
            }).sort({ createdAt: -1 });
            
            // Hàm tính toán ngày hết hạn dựa trên thời hạn
            function calculateExpiryDate(duration, baseDate = new Date()) {
                switch (duration) {
                    case '1_month':
                        return new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                    case '3_months':
                        return new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000);
                    case '6_months':
                        return new Date(baseDate.getTime() + 180 * 24 * 60 * 60 * 1000);
                    case 'permanent':
                        return new Date('2099-12-31');
                    default:
                        return new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                }
            }

            let validFrom = new Date();
            let validUntil;
            let licenseCode;
            
            // Xử lý các trường hợp
            if (!existingLicense) {
                // Trường hợp 1: Chưa có bản quyền -> tạo bản quyền mới
                console.log(`🆕 Tạo bản quyền mới cho sách ${item.book}`);
                validUntil = calculateExpiryDate(item.ebookOption.duration);
                licenseCode = EbookLicense.generateLicenseCode();
            } 
            else if (existingLicense.licenseType.duration === 'permanent') {
                // Trường hợp 2: Đã có bản quyền vĩnh viễn -> chỉ cập nhật updatedAt
                console.log(`⚠️ Người dùng đã có bản quyền vĩnh viễn cho sách ${item.book}, cập nhật thời gian`);
                
                // Cập nhật thời gian cho bản quyền vĩnh viễn
                existingLicense.updatedAt = new Date();
                await existingLicense.save();
                
                // Ghi lại giao dịch trong order nhưng không tạo bản quyền mới
                licenses.push(existingLicense);
                continue;
            }
            else if (existingLicense.status === 'active') {
                // Trường hợp 3: Đã có bản quyền còn hạn -> gia hạn thêm
                console.log(`⏱️ Gia hạn bản quyền cho sách ${item.book}`);
                
                // Cập nhật bản quyền đang hoạt động
                // Nếu gói mới là vĩnh viễn, đổi sang vĩnh viễn
                if (item.ebookOption.duration === 'permanent') {
                    existingLicense.validUntil = calculateExpiryDate('permanent');
                } else {
                    // Tính thời gian hết hạn mới = ngày hết hạn cũ + thời hạn gói mới
                    existingLicense.validUntil = calculateExpiryDate(item.ebookOption.duration, existingLicense.validUntil);
                }
                
                // Cập nhật thông tin gói bản quyền mới
                existingLicense.licenseType = {
                    duration: item.ebookOption.duration,
                    price: item.ebookOption.price
                };
                existingLicense.order = order._id; // Cập nhật tham chiếu đến đơn hàng mới
                
                await existingLicense.save();
                licenses.push(existingLicense);
                console.log(`✅ Đã cập nhật bản quyền: ${existingLicense.licenseCode} cho sách ${item.book}`);
                continue;
            }            else {
                // Trường hợp 4: Đã có bản quyền hết hạn -> cập nhật lại ngày
                console.log(`🔄 Gia hạn lại bản quyền đã hết hạn cho sách ${item.book}`);
                
                // Cập nhật bản quyền đã hết hạn
                existingLicense.validFrom = new Date(); // Ngày bắt đầu là hiện tại
                existingLicense.validUntil = calculateExpiryDate(item.ebookOption.duration);
                existingLicense.licenseType = {
                    duration: item.ebookOption.duration,
                    price: item.ebookOption.price
                };
                existingLicense.status = 'active';
                existingLicense.order = order._id; // Cập nhật tham chiếu đến đơn hàng mới
                
                await existingLicense.save();
                licenses.push(existingLicense);
                console.log(`✅ Đã cập nhật bản quyền: ${existingLicense.licenseCode} cho sách ${item.book}`);
                continue;
            }
            
            // Tạo bản quyền mới (chỉ cho trường hợp chưa có bản quyền)
            const licenseData = {
                user: order.user._id,
                book: item.book,
                order: order._id,
                licenseCode: licenseCode,
                licenseType: {
                    duration: item.ebookOption.duration,
                    price: item.ebookOption.price
                },
                validFrom: validFrom,
                validUntil: validUntil,
                status: 'active'
            };
            
            const license = new EbookLicense(licenseData);
            await license.save();
            
            licenses.push(license);
            console.log(`✅ Đã xử lý bản quyền: ${license.licenseCode} cho sách ${item.book}`);
        }
        // Log kết quả cuối cùng
        if (licenses.length > 0) {
            console.log(`🎉 Đã tạo thành công ${licenses.length} bản quyền mới cho đơn hàng ${order.orderCode} (ID: ${order._id})`);
        }
        
        if (skippedItems.length > 0) {
            console.log(`ℹ️ Đã bỏ qua ${skippedItems.length} bản quyền vì đã tồn tại trước đó`);
        }
        
        if (licenses.length === 0 && skippedItems.length === 0) {
            console.log(`⚠️ Không có sách nào trong đơn hàng để tạo bản quyền`);
        }
        
        return { success: true, licenses, skipped: skippedItems.length };
        
    } catch (error) {
        console.error('❌ Lỗi khi tạo bản quyền ebook:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Lấy danh sách bản quyền ebook của người dùng
 * @route GET /api/licenses/my-ebooks
 * @access Private
 */
export const getUserEbookLicenses = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        
        const filter = req.query.status ? { user: userId, status: req.query.status } : { user: userId };
        
        // Lấy danh sách bản quyền
        const licenses = await EbookLicense.find(filter)
            .populate('book', 'title author coverImages categories slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        // Đếm tổng số
        const total = await EbookLicense.countDocuments(filter);
          // Thống kê theo trạng thái
        const stats = await EbookLicense.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const statusStats = {};
        stats.forEach(stat => {
            statusStats[stat._id] = stat.count;
        });
        
        return res.status(200).json({
            success: true,
            licenses: licenses.map(license => ({
                _id: license._id,
                licenseCode: license.licenseCode,
                book: license.book,
                licenseType: license.licenseType,
                status: license.status,
                validFrom: license.validFrom,                validUntil: license.validUntil,
                isValid: license.isValid,
                daysRemaining: license.daysRemaining,
                createdAt: license.createdAt
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            },
            stats: statusStats
        });
        
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bản quyền:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách bản quyền',
            error: error.message
        });
    }
};

/**
 * Kiểm tra quyền truy cập ebook
 * @route GET /api/licenses/check-access/:bookId
 * @access Private
 */
export const checkEbookAccess = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.params;
        
        const result = await EbookLicense.checkAccess(userId, bookId);
          if (result.hasAccess) {
            return res.status(200).json({
                success: true,
                hasAccess: true,
                license: {
                    licenseCode: result.license.licenseCode,
                    validUntil: result.license.validUntil,
                    daysRemaining: result.license.daysRemaining
                }
            });
        } else {
            return res.status(403).json({
                success: false,
                hasAccess: false,
                reason: result.reason,
                message: result.reason === 'no_license' 
                    ? 'Bạn chưa sở hữu quyền truy cập sách này' 
                    : 'Bản quyền đã hết hạn'
            });
        }
        
    } catch (error) {
        console.error('Lỗi khi kiểm tra quyền truy cập:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi kiểm tra quyền truy cập',
            error: error.message
        });
    }
};

/**
 * Lấy chi tiết bản quyền
 * @route GET /api/licenses/:licenseId
 * @access Private
 */
export const getLicenseDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { licenseId } = req.params;
        
      const license = await EbookLicense.findOne({
            _id: licenseId,
            user: userId
        }).populate('book', 'title author coverImages description slug')
          .populate('order', 'orderCode createdAt totalAmount');
        
        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản quyền'
            });
        }
          // Tìm các bản quyền khác của cùng sách (lịch sử gia hạn)
        const renewalHistory = await EbookLicense.find({
            user: userId,
            book: license.book._id,
            _id: { $ne: license._id }
        }).select('licenseCode validFrom validUntil licenseType createdAt status')
          .sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            license: {
                ...license.toObject(),
                isValid: license.isValid,
                daysRemaining: license.daysRemaining,
                renewalHistory: renewalHistory.length > 0 ? renewalHistory : undefined
            }
        });
        
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết bản quyền:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy chi tiết bản quyền',
            error: error.message
        });
    }
};

/**
 * Admin: Lấy danh sách tất cả bản quyền
 * @route GET /api/admin/licenses
 * @access Admin
 */
export const getAllLicenses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.user) filter.user = req.query.user;
        if (req.query.book) filter.book = req.query.book;
        
        const licenses = await EbookLicense.find(filter)
            .populate('user', 'fullName email')
            .populate('book', 'title author slug')
            .populate('order', 'orderCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await EbookLicense.countDocuments(filter);
        
        return res.status(200).json({
            success: true,
            licenses,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
        
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bản quyền (Admin):', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách bản quyền',
            error: error.message
        });
    }
};

/**
 * Admin: Suspend/Unsuspend bản quyền
 * @route PUT /api/admin/licenses/:licenseId/suspend
 * @access Admin
 */
export const toggleLicenseSuspend = async (req, res) => {
    try {
        const { licenseId } = req.params;
        const { action, reason } = req.body; // action: 'suspend' | 'unsuspend'
        const adminId = req.user.id;
        
        const license = await EbookLicense.findById(licenseId);
        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản quyền'
            });
        }
          if (action === 'suspend') {
            await license.suspend(reason);
        } else if (action === 'unsuspend') {
            await license.reactivate();
        }
        
        return res.status(200).json({
            success: true,
            message: `Đã ${action === 'suspend' ? 'tạm dừng' : 'kích hoạt lại'} bản quyền thành công`,
            license
        });
        
    } catch (error) {
        console.error('Lỗi khi thay đổi trạng thái bản quyền:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi thay đổi trạng thái bản quyền',
            error: error.message
        });
    }
};
