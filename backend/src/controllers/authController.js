import User from "../models/user.js";
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinaryConfig.js';

// @desc    Đăng ký người dùng mới
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên, email và mật khẩu' });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo người dùng mới
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Trả về thông tin người dùng đã tạo (không có token)
      return res.status(201).json({
        message: 'Tạo tài khoản thành công',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      return res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    console.error('Register error:', error);
    
    // Xử lý lỗi từ mongoose validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Đăng nhập người dùng
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    // Tìm người dùng theo email và lấy cả trường password
    const user = await User.findOne({ email }).select('+password');
    
    // Kiểm tra nếu không tìm thấy người dùng
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Kiểm tra mật khẩu
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Kiểm tra tài khoản có bị cấm không
    if (user.isBanned) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Chuẩn bị dữ liệu người dùng để trả về
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };

    // Ghi log thông tin đăng nhập
    console.log('\n========== USER LOGIN ==========');
    console.log(`📧 Email : ${userData.email}`);
    console.log(`🔑 Role  : ${userData.role}`);
    console.log(`🪙 Token : ${token}`);
    console.log('================================\n');


    // Trả về thông tin người dùng và token
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, dateOfBirth, faculty, major } = req.body;
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực

    // Tìm người dùng theo ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Cập nhật họ tên nếu được cung cấp
    if (name) {
      user.name = name;
    }

    // Cập nhật ngày sinh nếu được cung cấp
    if (dateOfBirth !== undefined) {
      // Nếu dateOfBirth là null hoặc chuỗi trống, cho phép xóa ngày sinh
      if (dateOfBirth === null || dateOfBirth === '') {
        user.dateOfBirth = null;
      } else {
        // Kiểm tra định dạng ngày hợp lệ
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) { // Kiểm tra ngày hợp lệ
          return res.status(400).json({ message: 'Ngày sinh không hợp lệ' });
        }
        
        // Kiểm tra ngày sinh không trong tương lai
        if (date > new Date()) {
          return res.status(400).json({ message: 'Ngày sinh không thể là ngày trong tương lai' });
        }
        
        user.dateOfBirth = date;
      }
    }

    // Cập nhật khoa nếu được cung cấp
    if (faculty !== undefined) {
      user.faculty = faculty;
    }

    // Cập nhật ngành nếu được cung cấp
    if (major !== undefined) {
      user.major = major;
    }

    // Lưu thay đổi
    await user.save();

    // Trả về thông tin người dùng đã cập nhật
    res.status(200).json({
      message: 'Cập nhật thông tin thành công',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        faculty: user.faculty,
        major: user.major,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Xử lý lỗi từ mongoose validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật ảnh đại diện
// @route   PUT /api/auth/update-avatar
// @access  Private
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực
    
    // Tìm người dùng theo ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Kiểm tra xem có file ảnh trong yêu cầu không
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên ảnh đại diện' });
    }
    
    // Upload ảnh lên Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'user_avatars', // Thư mục trên Cloudinary
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      // Truyền buffer của file vào upload stream
      uploadStream.end(req.file.buffer);
    });
    
    // Lấy URL của ảnh từ Cloudinary
    const avatarUrl = result.secure_url;
    
    // Cập nhật URL ảnh đại diện vào cơ sở dữ liệu
    user.avatar = avatarUrl;
    await user.save();
    
    // Trả về thông tin cập nhật
    res.status(200).json({
      message: 'Cập nhật ảnh đại diện thành công',
      avatar: avatarUrl
    });
    
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Lấy thông tin cá nhân
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực

    // Tìm người dùng theo ID, không lấy trường password
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    // Trả về thông tin người dùng
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        faculty: user.faculty,
        major: user.major,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
