import mongoose from 'mongoose';

// Schema cho từng item trong giỏ hàng
const cartItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Vui lòng chọn sách']
  },
  ebookOption: {
    duration: {
      type: String,
      enum: ['1_month', '3_months', '6_months', 'permanent'],
      required: [true, 'Vui lòng chọn thời hạn sử dụng']
    },
    price: {
      type: Number,
      required: [true, 'Giá không được để trống'],
      min: [0, 'Giá không thể âm']
    }
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true }); // Thay đổi thành true để có thể quản lý items

// Schema chính cho giỏ hàng
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Giỏ hàng phải thuộc về một người dùng'],
    unique: true // Mỗi user chỉ có một giỏ hàng
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tổng tiền không thể âm']
  },
  totalItems: {
    type: Number,
    default: 0,
    min: [0, 'Tổng số items không thể âm']
    // Giải thích: Tổng số lượng items trong giỏ hàng (bằng số lượng sách khác nhau)
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware tự động tính toán tổng tiền và số lượng items
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.length; // Đếm số lượng items (mỗi item = 1 sách)
  this.totalAmount = this.items.reduce((total, item) => total + item.ebookOption.price, 0);
  this.lastUpdated = new Date();
  next();
});

// Index để tối ưu query
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.book': 1 });
cartSchema.index({ lastUpdated: -1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
