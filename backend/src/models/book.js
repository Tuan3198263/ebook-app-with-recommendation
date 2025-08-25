import mongoose from 'mongoose';
import slugify from 'slugify';

// Schema cho các tùy chọn thuê/mua ebook
const ebookOptionSchema = new mongoose.Schema({
  duration: {
    type: String,
    enum: ['1_month', '3_months', '6_months', 'permanent'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Giá không thể âm']
  }
}, { _id: false });

// Schema chính cho sách
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tên sách'],
    trim: true,
    maxlength: [200, 'Tên sách không được quá 200 ký tự']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  coverImages: [{
    type: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Vui lòng chọn danh mục sách']
  },
  authors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Vui lòng chọn ít nhất một tác giả']
  }],
  publisher: {
    type: String,
    trim: true
  },
  dimensions: {
    type: String,
    trim: true
  },
  publicationYear: {
    type: Number,
    min: [1000, 'Năm xuất bản không hợp lệ'],
    max: [new Date().getFullYear(), 'Năm xuất bản không thể lớn hơn năm hiện tại']
  },
  isbn: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    trim: true,
    default: 'Tiếng Việt'
  },
  bookFiles: {
    epub: {
      type: String,
      trim: true
    },
    pdf: {
      type: String,
      trim: true
    }
  },
  availableFormats: [{
    type: String,
    enum: ['epub', 'pdf']
  }],
  primaryFormat: {
    type: String,
    enum: ['epub', 'pdf'],
    default: 'epub'
  },
  documentType: {
    type: String,
    enum: ['textbook', 'other'],
    default: 'other',
    required: [true, 'Vui lòng chọn loại tài liệu']
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'Vui lòng nhập mô tả sách']
  },
  ebookOptions: {
    type: [ebookOptionSchema],
    required: [true, 'Vui lòng thêm ít nhất một tùy chọn giá cho ebook'],
    validate: [arrayLimit, 'Phải có ít nhất một tùy chọn giá']
  },
  // Thông tin đánh giá
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // Các thông tin khác
  pages: {
    type: Number,
    min: [1, 'Số trang phải lớn hơn 0']
  },
  active: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validator để đảm bảo có ít nhất một tùy chọn giá
function arrayLimit(val) {
  return val.length > 0;
}

// Middleware tạo slug từ tiêu đề sách và validate bookFiles
bookSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      locale: 'vi'
    });
  }
  
  // Validation cho bookFiles - đảm bảo có ít nhất 1 file
  const hasAtLeastOneFile = this.bookFiles?.epub || this.bookFiles?.pdf;
  if (!hasAtLeastOneFile) {
    return next(new Error('Vui lòng tải lên ít nhất một file ebook (EPUB hoặc PDF)'));
  }
  
  // Tự động cập nhật availableFormats
  this.availableFormats = [];
  if (this.bookFiles.epub) this.availableFormats.push('epub');
  if (this.bookFiles.pdf) this.availableFormats.push('pdf');
  
  next();
});

// Virtual cho reviews - tham chiếu đến các đánh giá
bookSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'book'
});

// Virtual cho recently viewed - để thống kê
bookSchema.virtual('recentViews', {
  ref: 'RecentlyViewed',
  localField: '_id',
  foreignField: 'bookId'
});

// Static method để tính toán lại rating
bookSchema.statics.calculateAverageRating = async function(bookId) {
  const stats = await this.model('Review').aggregate([
    {
      $match: { book: bookId }
    },
    {
      $group: {
        _id: '$book',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(bookId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10, // Làm tròn đến 1 chữ số thập phân
      totalReviews: stats[0].count
    });
  } else {
    await this.findByIdAndUpdate(bookId, {
      averageRating: 0,
      totalReviews: 0
    });
  }
};

const Book = mongoose.model('Book', bookSchema);

export default Book;
