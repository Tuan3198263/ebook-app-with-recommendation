import mongoose from 'mongoose';
import slugify from 'slugify';

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên tác giả'],
    trim: true,
    maxlength: [100, 'Tên tác giả không được quá 100 ký tự']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Tiểu sử không được quá 1000 ký tự']
  }
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// Middleware trước khi lưu: Tạo slug từ name
authorSchema.pre('save', function(next) {
  // Chỉ tạo slug nếu name được sửa hoặc là mới
  if (this.isModified('name')) {
    // Tạo slug từ name, loại bỏ dấu tiếng Việt và thay thế khoảng trắng bằng dấu gạch ngang
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'vi'
    });
  }
  next();
});

const Author = mongoose.model('Author', authorSchema);

export default Author;
