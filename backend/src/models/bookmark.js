import mongoose from 'mongoose';

/**
 * Schema Bookmark - Đánh dấu trang trong sách
 * Tham chiếu tới Book thay vì License để đảm bảo bookmark tồn tại lâu dài
 */
const bookmarkSchema = new mongoose.Schema({
  // Thông tin người dùng
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người dùng không được để trống'],
    index: true
  },
  
  // Tham chiếu tới sách (không phải license)
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Sách không được để trống'],
    index: true
  },
  
  // Vị trí trong sách (CFI - Canonical Fragment Identifier)
  cfi: {
    type: String,
    required: [true, 'Vị trí CFI không được để trống'],
    trim: true,
    index: true
  },
  
  // Tiêu đề bookmark do user đặt
  title: {
    type: String,
    required: [true, 'Tiêu đề bookmark không được để trống'],
    trim: true,
    maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes cho hiệu suất truy vấn
bookmarkSchema.index({ user: 1, book: 1, createdAt: -1 });
bookmarkSchema.index({ user: 1, createdAt: -1 });

// Middleware: Validate CFI format
bookmarkSchema.pre('save', function(next) {
  // Basic CFI validation
  if (this.cfi && !this.cfi.startsWith('epubcfi(')) {
    return next(new Error('CFI format không hợp lệ'));
  }
  next();
});

// Static method: Lấy bookmarks của user cho một cuốn sách
bookmarkSchema.statics.getUserBookmarks = async function(userId, bookId) {
  return this.find({
    user: userId,
    book: bookId
  }).sort({ createdAt: -1 });
};

// Static method: Kiểm tra user có quyền tạo bookmark không
bookmarkSchema.statics.canCreateBookmark = async function(userId, bookId) {
  const EbookLicense = mongoose.model('EbookLicense');
  
  const license = await EbookLicense.findOne({
    user: userId,
    book: bookId,
    status: 'active'
  });
  
  return !!license;
};

// Static method: Xóa tất cả bookmarks của user cho một cuốn sách
bookmarkSchema.statics.deleteAllUserBookmarks = async function(userId, bookId) {
  const result = await this.deleteMany({
    user: userId,
    book: bookId
  });
  
  return result;
};

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
