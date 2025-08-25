import Category from "../models/category.js";

// @desc    Lấy tất cả danh mục
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    // Mặc định lấy tất cả danh mục đang active
    const filter = req.query.showAll === 'true' ? {} : {  };
    const categories = await Category.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh mục',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết danh mục theo ID hoặc slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
export const getCategoryDetail = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Tìm kiếm theo ID hoặc slug
    const category = await Category.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(idOrSlug) ? idOrSlug : null },
        { slug: idOrSlug }
      ]
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết danh mục',
      error: error.message
    });
  }
};

// @desc    Thêm danh mục mới
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên danh mục'
      });
    }
    
    // Tạo danh mục mới
    const newCategory = await Category.create({ name });
    
    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: newCategory
    });
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error);
    
    // Xử lý lỗi trùng tên danh mục
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại'
      });
    }
    
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
      message: 'Lỗi khi tạo danh mục',
      error: error.message
    });
  }
};

// @desc    Cập nhật thông tin danh mục
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên danh mục'
      });
    }
    
    // Tìm và cập nhật danh mục
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }
    
    // Cập nhật tên danh mục (slug sẽ tự động cập nhật thông qua middleware)
    category.name = name;
    await category.save();
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật danh mục:', error);
    
    // Xử lý lỗi trùng tên danh mục
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại'
      });
    }
    
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
      message: 'Lỗi khi cập nhật danh mục',
      error: error.message
    });
  }
};

// @desc    Xóa danh mục
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Kiểm tra xem có sách thuộc danh mục này không
    const Book = require('../models/book.js');
    const bookCount = await Book.countDocuments({ category: id });
    if (bookCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục vì vẫn còn sách thuộc danh mục này. Vui lòng xóa hoặc chuyển sách trước.'
      });
    }

    await Category.deleteOne({ _id: id });
    res.status(200).json({
      success: true,
      message: 'Đã xóa danh mục thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa danh mục',
      error: error.message
    });
  }
};

// @desc    Ẩn/Hiện danh mục
// @route   PATCH /api/categories/:id/toggle-status
// @access  Private (Admin)
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }
    
    // Đảo ngược trạng thái active
    category.active = !category.active;
    await category.save();
    
    const statusMessage = category.active ? 'hiển thị' : 'ẩn';
    
    res.status(200).json({
      success: true,
      message: `Đã ${statusMessage} danh mục thành công`,
      data: category
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi trạng thái danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái danh mục',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách ngắn gọn danh mục (chỉ _id và name) cho dropdown
// @route   GET /api/categories/list
// @access  Public
export const getCategoriesList = async (req, res) => {
  try {
    // Chỉ lấy danh mục đang active và chỉ lấy trường _id, name
    const categories = await Category.find({ active: true })
      .select('_id name')
      .sort({ name: 1 }); // Sắp xếp theo tên A-Z
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách danh mục',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách danh mục cho trang sản phẩm
// @route   GET /api/categories/product-categories
// @access  Public
export const getProductCategories = async (req, res) => {
  try {
    // Chỉ lấy danh mục đang active và lấy trường _id, name, slug
    const categories = await Category.find({ active: true })
      .select('_id name slug')
      .sort({ name: 1 }); // Sắp xếp theo tên A-Z
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách danh mục sản phẩm',
      error: error.message
    });
  }
};
