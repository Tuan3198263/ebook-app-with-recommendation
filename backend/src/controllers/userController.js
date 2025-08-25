import User from '../models/user.js';
import Order from '../models/order.js';



// Lấy danh sách user, tổng số user, thống kê theo faculty
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    const totalUsers = users.length;
    // Thống kê số lượng user theo faculty
    const facultyStats = {};
    users.forEach(user => {
      const faculty = user.faculty || 'Chưa xác định';
      facultyStats[faculty] = (facultyStats[faculty] || 0) + 1;
    });
    res.status(200).json({
      success: true,
      totalUsers,
      facultyStats,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách user', error: error.message });
  }
};

// Lấy chi tiết 1 user, kèm số lượng đơn hàng
export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    const orderCount = await Order.countDocuments({ user: id });
    res.status(200).json({
      success: true,
      data: user,
      orderCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết user', error: error.message });
  }
};

// Chỉnh sửa chi tiết 1 user (không được sửa email)
export const updateUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, isBanned, dateOfBirth, faculty, major, role } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    // Không cho phép sửa email
    // Cập nhật các trường hợp lệ
    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (isBanned !== undefined) user.isBanned = isBanned;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (faculty !== undefined) user.faculty = faculty;
    if (major !== undefined) user.major = major;
    if (role !== undefined && ['student','admin','teacher'].includes(role)) user.role = role;
    await user.save();
    res.status(200).json({ success: true, message: 'Cập nhật user thành công', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật user', error: error.message });
  }
};
