import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên danh mục'],
    trim: true,
    unique: true,
    maxlength: [100, 'Tên danh mục không được quá 100 ký tự'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]+$/.test(v);
      },
      message: props => 'Tên danh mục không được chứa ký tự đặc biệt'
    }
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// Middleware trước khi lưu: Tạo slug từ name
categorySchema.pre('save', function(next) {
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

const Category = mongoose.model('Category', categorySchema);

export default Category;
