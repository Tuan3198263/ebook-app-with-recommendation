import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng cung cấp ID người dùng'],
    unique: true // Đảm bảo mỗi người dùng chỉ có một địa chỉ
  },
  fullname: {
    type: String,
    required: [true, 'Vui lòng nhập họ và tên'],
    trim: true,
    maxlength: [100, 'Họ và tên không được vượt quá 100 ký tự']
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10,11}$/.test(v);
      },
      message: props => 'Số điện thoại không hợp lệ'
    }
  },
  address: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ chi tiết'],
    trim: true,
    maxlength: [150, 'Địa chỉ không được vượt quá 150 ký tự']
  },
  provinceId: {
    type: Number,
    required: [true, 'Vui lòng chọn tỉnh/thành phố']
  },
  provinceName: {
    type: String,
    required: [true, 'Tên tỉnh/thành phố không được để trống'],
    trim: true
  },
  districtId: {
    type: Number,
    required: [true, 'Vui lòng chọn quận/huyện']
  },
  districtName: {
    type: String,
    required: [true, 'Tên quận/huyện không được để trống'],
    trim: true
  },
  wardId: {
    type: Number,
    required: [true, 'Vui lòng chọn phường/xã']
  },
  wardName: {
    type: String,
    required: [true, 'Tên phường/xã không được để trống'],
    trim: true
  }
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

const Address = mongoose.model('Address', addressSchema);

export default Address;
