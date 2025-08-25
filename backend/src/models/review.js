import mongoose from 'mongoose';

/**
 * Schema cho đánh giá sách
 * Chỉ cho phép người dùng có bản quyền vĩnh viễn đánh giá
 * Mỗi người dùng chỉ được đánh giá một lần cho mỗi sách
 */
const reviewSchema = new mongoose.Schema({
  // Người đánh giá
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người đánh giá không được để trống'],
    index: true
  },
  
  // Sách được đánh giá
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Sách không được để trống'],
    index: true
  },
  
  // Bản quyền vĩnh viễn liên quan
  license: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EbookLicense',
    required: [true, 'Bản quyền không được để trống']
  },
    // Điểm đánh giá (1-5 sao)
  rating: {
    type: Number,
    required: [true, 'Điểm đánh giá không được để trống'],
    min: [1, 'Điểm đánh giá thấp nhất là 1'],
    max: [5, 'Điểm đánh giá cao nhất là 5']
  },
    // Nội dung đánh giá (không bắt buộc)
  content: {
    type: String,
    trim: true,
    maxlength: [300, 'Nội dung đánh giá không được quá 300 ký tự']
  },
  
  // Trạng thái đánh giá
  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Đảm bảo mỗi người dùng chỉ đánh giá mỗi sách một lần
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

// Middleware để tự động cập nhật điểm trung bình cho sách
reviewSchema.post('save', async function() {
  // Đây là nơi gọi phương thức calculateAverageRating trên model Book
  await this.constructor.model('Book').calculateAverageRating(this.book);
});

reviewSchema.post('findOneAndUpdate', async function(doc) {
  // Khi cập nhật đánh giá, cũng cập nhật lại điểm trung bình
  if (doc) {
    await this.model('Book').calculateAverageRating(doc.book);
  }
});

reviewSchema.post('remove', async function() {
  // Khi xóa đánh giá, cập nhật lại điểm trung bình
  await this.constructor.model('Book').calculateAverageRating(this.book);
});

// Phương thức static: Kiểm tra xem người dùng có được phép đánh giá sách không
reviewSchema.statics.checkReviewEligibility = async function(userId, bookId) {
  // Tìm bản quyền vĩnh viễn
  const license = await mongoose.model('EbookLicense').findOne({
    user: userId,
    book: bookId,
    status: 'active',
    'licenseType.duration': 'permanent'
  });
  
  if (!license) {
    return {
      canReview: false,
      reason: 'Chỉ người dùng sở hữu bản quyền vĩnh viễn mới có thể đánh giá sách'
    };
  }
  
  // Kiểm tra xem người dùng đã đánh giá chưa
  const existingReview = await this.findOne({
    user: userId,
    book: bookId
  });
    if (existingReview) {
    return {
      canReview: false,
      canUpdate: false,
      reason: 'Bạn đã đánh giá sách này trước đó và không thể chỉnh sửa đánh giá',
      existingReview
    };
  }
  
  return {
    canReview: true,
    license
  };
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
