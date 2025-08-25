import Address from '../models/address.js';

// @desc    Tạo hoặc cập nhật địa chỉ của người dùng
// @route   POST /api/addresses
// @access  Private
export const createOrUpdateAddress = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực
    
    const {
      fullname,
      phone,
      address,
      provinceId,
      provinceName,
      districtId,
      districtName,
      wardId,
      wardName
    } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!fullname || !phone || !address || !provinceId || !provinceName || 
        !districtId || !districtName || !wardId || !wardName) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin địa chỉ'
      });
    }
    
    // Tìm địa chỉ hiện tại của người dùng
    let userAddress = await Address.findOne({ user: userId });
    
    if (userAddress) {
      // Cập nhật địa chỉ hiện tại nếu đã tồn tại
      userAddress.fullname = fullname;
      userAddress.phone = phone;
      userAddress.address = address;
      userAddress.provinceId = provinceId;
      userAddress.provinceName = provinceName;
      userAddress.districtId = districtId;
      userAddress.districtName = districtName;
      userAddress.wardId = wardId;
      userAddress.wardName = wardName;
      
      await userAddress.save();
      
      return res.status(200).json({
        success: true,
        message: 'Cập nhật địa chỉ thành công',
        data: userAddress
      });
    } else {
      // Tạo địa chỉ mới nếu chưa tồn tại
      const newAddress = await Address.create({
        user: userId,
        fullname,
        phone,
        address,
        provinceId,
        provinceName,
        districtId,
        districtName,
        wardId,
        wardName,
      });
      
      return res.status(201).json({
        success: true,
        message: 'Thêm địa chỉ thành công',
        data: newAddress
      });
    }
  } catch (error) {
    console.error('Lỗi khi thao tác với địa chỉ:', error);
    
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thao tác với địa chỉ',
      error: error.message
    });
  }
};

// @desc    Lấy địa chỉ của người dùng
// @route   GET /api/addresses
// @access  Private
export const getUserAddress = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực
    
    // Tìm địa chỉ của người dùng
    const address = await Address.findOne({ user: userId });
    
    // Không trả về lỗi 404 nữa, thay vào đó trả về thành công với data là null
    return res.status(200).json({
      success: true,
      data: address || null,
      message: address ? '' : 'Chưa có thông tin địa chỉ'
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy địa chỉ người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy địa chỉ người dùng',
      error: error.message
    });
  }
};
