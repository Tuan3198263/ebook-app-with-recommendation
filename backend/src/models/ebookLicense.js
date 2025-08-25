import mongoose from 'mongoose';

/**
 * Schema bản quyền ebook - Đơn giản hóa
 * Chỉ quản lý quyền truy cập cơ bản của người dùng sau khi mua thành công
 */
const ebookLicenseSchema = new mongoose.Schema({
  // Thông tin chủ sở hữu
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người dùng không được để trống'],
    index: true
  },
  
  // Thông tin sách
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Sách không được để trống'],
    index: true
  },
  
  // Thông tin đơn hàng liên quan
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Đơn hàng không được để trống']
  },
  
  // Mã bản quyền duy nhất
  licenseCode: {
    type: String,
    required: [true, 'Mã bản quyền không được để trống'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Gói bản quyền đã mua
  licenseType: {
    duration: {
      type: String,
      enum: ['1_month', '3_months', '6_months', 'permanent'],
      required: [true, 'Thời hạn bản quyền không được để trống']
    },
    price: {
      type: Number,
      required: [true, 'Giá bản quyền không được để trống'],
      min: [0, 'Giá không thể âm']
    }
  },
  
  // Thời gian hiệu lực
  validFrom: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  validUntil: {
    type: Date,
    required: [true, 'Thời gian hết hạn không được để trống'],
    index: true
  },  // Trạng thái bản quyền  
   status: {
    type: String,
    enum: ['active', 'expired', 'suspended'],
    default: 'active',
    required: true,
    index: true
  }
},
 {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: Kiểm tra bản quyền có còn hiệu lực không
ebookLicenseSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') return false;
  if (this.licenseType.duration === 'permanent') return true;
  return new Date() <= this.validUntil;
});

// Virtual: Số ngày còn lại
ebookLicenseSchema.virtual('daysRemaining').get(function() {
  if (this.licenseType.duration === 'permanent') return null;
  if (this.status !== 'active') return 0;
  
  const now = new Date();
  const diffTime = this.validUntil - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Middleware: Tự động tính toán validUntil khi tạo mới
ebookLicenseSchema.pre('save', function(next) {
  if (this.isNew && !this.validUntil) {
    const duration = this.licenseType.duration;
    const from = this.validFrom || new Date();
    
    switch (duration) {
      case '1_month':
        this.validUntil = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case '3_months':
        this.validUntil = new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      case '6_months':
        this.validUntil = new Date(from.getTime() + 180 * 24 * 60 * 60 * 1000);
        break;
      case 'permanent':
        this.validUntil = new Date('2099-12-31'); // Ngày rất xa
        break;
      default:
        this.validUntil = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

// Middleware: Tự động cập nhật trạng thái khi hết hạn
ebookLicenseSchema.pre('find', function() {
  // Tự động cập nhật các bản quyền hết hạn
  const now = new Date();
  this.model.updateMany(
    {
      status: 'active',
      validUntil: { $lt: now },
      'licenseType.duration': { $ne: 'permanent' }
    },
    { $set: { status: 'expired' } }
  ).exec();
});

// Index cho hiệu suất
ebookLicenseSchema.index({ user: 1, book: 1 }); // Composite index
ebookLicenseSchema.index({ user: 1, status: 1 });
ebookLicenseSchema.index({ book: 1, status: 1 });
ebookLicenseSchema.index({ validUntil: 1, status: 1 });
ebookLicenseSchema.index({ licenseCode: 1 }, { unique: true });
ebookLicenseSchema.index({ createdAt: -1 });

// Phương thức static: Tạo mã bản quyền
ebookLicenseSchema.statics.generateLicenseCode = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EBL-${timestamp}-${random}`;
};

// Phương thức static: Kiểm tra quyền truy cập
ebookLicenseSchema.statics.checkAccess = async function(userId, bookId) {
  const license = await this.findOne({
    user: userId,
    book: bookId,
    status: 'active'
  });
  
  if (!license) return { hasAccess: false, reason: 'no_license' };
  if (!license.isValid) return { hasAccess: false, reason: 'expired' };
  
  return { hasAccess: true, license };
};

// Phương thức instance: Suspend bản quyền
ebookLicenseSchema.methods.suspend = function(reason) {
  this.status = 'suspended';
  return this.save();
};

// Phương thức instance: Kích hoạt lại bản quyền
ebookLicenseSchema.methods.reactivate = function() {
  if (this.status === 'suspended') {
    this.status = 'active';
  }
  return this.save();
};

const EbookLicense = mongoose.model('EbookLicense', ebookLicenseSchema);

export default EbookLicense;
