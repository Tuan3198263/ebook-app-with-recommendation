import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [70, 'Họ tên không được quá 70 ký tự'],
    validate: {
      validator: function(v) {
        return /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(v);
      },
      message: props => 'Họ tên không được chứa ký tự đặc biệt hoặc số'
    }
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: 6,
    select: false // Không trả về password khi query
  },
  avatar: {
    type: String,
    default: 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png'
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  faculty: {
    type: String, // Khoa trong trường đại học
    trim: true,
    default: ''
  },
  major: {
    type: String, // Ngành đang học
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'teacher'],
    default: 'student'
  }
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// Phương thức kiểm tra mật khẩu (so sánh trực tiếp cho môi trường test)
userSchema.methods.matchPassword = async function(enteredPassword) {
  return enteredPassword === this.password;
};

const User = mongoose.model('User', userSchema);

export default User;
