import mongoose from 'mongoose';

/**
 * SCHEMA TỐI ƯU CHO EBOOK (Sản phẩm số):
 * 
 * Chỉ sử dụng 1 trường: orderStatus
 * 
 * Flow nghiệp vụ:
 * - pending: Đang chờ thanh toán
 * - completed: Thanh toán thành công + truy cập ebook ngay lập tức
 * - failed: Thanh toán thất bại
 * - canceled: Đã hủy (hết hạn hoặc người dùng hủy)
 * - refunded: Đã hoàn tiền (nếu cần)
 */

// Schema cho từng sản phẩm trong đơn hàng
const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Sách không được để trống']
  },
  title: {
    type: String,
    required: [true, 'Tên sách không được để trống']
  },
  coverImage: {
    type: String
  },
  ebookOption: {
    duration: {
      type: String,
      enum: ['1_month', '3_months', '6_months', 'permanent'],
      required: [true, 'Thời hạn sử dụng không được để trống']
    },
    price: {
      type: Number,
      required: [true, 'Giá không được để trống'],
      min: [0, 'Giá không thể âm']
    }
  }
}, { _id: true });

// Schema cho thông tin thanh toán
// Schema cho thông tin thanh toán VNPay (tối ưu cho VNPay response)
const paymentDetailsSchema = new mongoose.Schema({
  // Thông tin giao dịch chính
  transactionId: {
    type: String,
    description: 'Mã giao dịch VNPay (vnp_TransactionNo)'
  },
  // Thông tin ngân hàng
  bankCode: {
    type: String,
    description: 'Mã ngân hàng (vnp_BankCode)'
  },
  bankTranNo: {
    type: String,
    description: 'Mã giao dịch tại ngân hàng (vnp_BankTranNo)'
  },
  cardType: {
    type: String,
    description: 'Loại thẻ thanh toán (vnp_CardType)'
  },
  // Thông tin thời gian và kết quả
  payDate: {
    type: String,
    description: 'Thời gian thanh toán (vnp_PayDate) - Format: yyyyMMddHHmmss'
  },
  responseCode: {
    type: String,
    description: 'Mã phản hồi (vnp_ResponseCode) - 00: Thành công'
  },
  transactionStatus: {
    type: String,
    description: 'Trạng thái giao dịch (vnp_TransactionStatus) - 00: Thành công'
  },
  // Số tiền (đã chia 100)
  amount: {
    type: Number,
    description: 'Số tiền thực tế (đã chia 100 từ vnp_Amount)'
  },
  // Thông báo lỗi (chỉ khi có lỗi)
  responseMessage: {
    type: String,
    description: 'Thông báo lỗi khi thanh toán thất bại'
  }
}, { _id: false });

// Schema chính cho đơn hàng
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Đơn hàng phải thuộc về một người dùng']
  },
  orderCode: {
    type: String,
    required: [true, 'Mã đơn hàng không được để trống'],
    unique: true,
    trim: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Tổng tiền không được để trống'],
    min: [0, 'Tổng tiền không thể âm']
  },  paymentMethod: {
    type: String,
    required: [true, 'Phương thức thanh toán không được để trống'],
    enum: ['vnpay', 'other'],
    default: 'vnpay'
  },
  orderStatus: {
    type: String,
    required: [true, 'Trạng thái đơn hàng không được để trống'],
    enum: ['pending', 'completed', 'failed', 'canceled', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    type: paymentDetailsSchema,
    default: {}
  },
  paymentIntent: {
    type: String,
    trim: true
  },
  paymentError: {
    type: String,
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Mặc định hết hạn sau 30 phút kể từ khi tạo
      return new Date(Date.now() + 30 * 60 * 1000);
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware trước khi lưu để tính toán tổng số sản phẩm
orderSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  next();
});

// Index để tối ưu truy vấn
orderSchema.index({ user: 1 });
orderSchema.index({ orderCode: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
// Thêm index cho expiresAt để tối ưu việc tìm kiếm đơn hàng hết hạn
orderSchema.index({ expiresAt: 1 });
orderSchema.index({ user: 1, orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
