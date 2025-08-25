import Author from '../models/author.js'; // Chữ a viết thường nếu file là author.js
import Book from '../models/book.js';
import Category from '../models/category.js';
import mongoose from 'mongoose';

// @desc    Lấy danh sách tất cả tác giả
// @route   GET /api/authors
// @access  Public
export const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find().sort({ createdAt: -1 });
    
    // Đếm số sách của mỗi tác giả
    const authorsWithBookCount = await Promise.all(
      authors.map(async (author) => {
        const bookCount = await Book.countDocuments({ authors: author._id });
        return {
          ...author.toObject(),
          bookCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: authors.length,
      data: authorsWithBookCount
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tác giả:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tác giả',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết tác giả theo ID hoặc slug
// @route   GET /api/authors/:idOrSlug
// @access  Public
export const getAuthorDetail = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Kiểm tra xem idOrSlug có phải là ID hợp lệ không
    const isValidId = mongoose.Types.ObjectId.isValid(idOrSlug);
    
    // Tìm kiếm theo ID hoặc slug
    const author = await Author.findOne({
      $or: [
        { _id: isValidId ? idOrSlug : null },
        { slug: idOrSlug }
      ]
    });
    
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tác giả'
      });
    }
    
    // Lấy số sách của tác giả
    const bookCount = await Book.countDocuments({ authors: author._id });
    
    // Lấy danh sách sách của tác giả
    const books = await Book.find({ authors: author._id })
      .select('title slug publicationYear coverImages')
      .limit(5);  // Giới hạn số sách trả về để tránh quá tải
    
    // Tạo đối tượng kết quả với thông tin bổ sung
    const authorWithDetails = {
      ...author.toObject(),
      bookCount,
      books
    };
    
    res.status(200).json({
      success: true,
      data: authorWithDetails
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết tác giả:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết tác giả',
      error: error.message
    });
  }
};

// @desc    Thêm tác giả mới
// @route   POST /api/authors
// @access  Private (Admin)
export const createAuthor = async (req, res) => {
  try {
    const { name, bio } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên tác giả'
      });
    }
    
    // Tạo tác giả mới
    const newAuthor = await Author.create({ 
      name, 
      bio: bio || ''
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo tác giả thành công',
      data: newAuthor
    });
  } catch (error) {
    console.error('Lỗi khi tạo tác giả:', error);
    
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
      message: 'Lỗi khi tạo tác giả',
      error: error.message
    });
  }
};

// @desc    Cập nhật thông tin tác giả
// @route   PUT /api/authors/:id
// @access  Private (Admin)
export const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio } = req.body;
    
    // Tìm tác giả cần cập nhật
    const author = await Author.findById(id);
    
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tác giả'
      });
    }
    
    // Cập nhật thông tin
    if (name) author.name = name;
    if (bio !== undefined) author.bio = bio;
    
    // Lưu thay đổi
    await author.save();
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật tác giả thành công',
      data: author
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật tác giả:', error);
    
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
      message: 'Lỗi khi cập nhật tác giả',
      error: error.message
    });
  }
};

// @desc    Xóa tác giả
// @route   DELETE /api/authors/:id
// @access  Private (Admin)
export const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm và xóa tác giả
    const author = await Author.findByIdAndDelete(id);
    
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tác giả'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Xóa tác giả thành công',
      data: {}
    });
  } catch (error) {
    console.error('Lỗi khi xóa tác giả:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tác giả',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách ngắn gọn tác giả (chỉ _id và name) cho dropdown
// @route   GET /api/authors/list
// @access  Public
export const getAuthorsList = async (req, res) => {
  try {
    // Chỉ lấy các trường _id và name
    const authors = await Author.find()
      .select('_id name')
      .sort({ name: 1 }); // Sắp xếp theo tên A-Z
    
    res.status(200).json({
      success: true,
      count: authors.length,
      data: authors
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tác giả:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tác giả',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách tác giả theo danh mục sách
// @route   GET /api/authors/by-category/:slug
// @access  Public
export const getAuthorsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // Tìm danh mục theo slug
    const category = await Category.findOne({ slug, active: true });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Tìm tất cả sách thuộc danh mục này
    const books = await Book.find({ 
      category: category._id, 
      active: true 
    }).select('authors');

    // Trích xuất ID tất cả tác giả (loại bỏ trùng lặp)
    const authorIds = [...new Set(books.flatMap(book => book.authors))];

    // Lấy thông tin của các tác giả
    const authors = await Author.find({ 
      _id: { $in: authorIds } 
    }).select('_id name slug').sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: authors.length,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug
      },
      data: authors
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tác giả theo danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tác giả theo danh mục',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách tác giả theo từ khóa tìm kiếm của sách
// @route   GET /api/authors/by-book-keyword
// @access  Public
export const getAuthorsByBookKeyword = async (req, res) => {
  try {
    const { q: keyword } = req.query;

    // Kiểm tra từ khóa tìm kiếm
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    // Tìm tất cả sách có tiêu đề chứa từ khóa (không phân biệt hoa thường)
    const books = await Book.find({ 
      title: { 
        $regex: keyword.trim(), 
        $options: 'i' 
      },
      active: true 
    }).select('authors');

    // Trích xuất ID tất cả tác giả (loại bỏ trùng lặp)
    const authorIds = [...new Set(books.flatMap(book => book.authors))];

    // Kiểm tra nếu không tìm thấy tác giả nào
    if (authorIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        keyword: keyword.trim(),
        message: 'Không tìm thấy tác giả nào có sách liên quan đến từ khóa này',
        data: []
      });
    }

    // Lấy thông tin của các tác giả
    const authors = await Author.find({ 
      _id: { $in: authorIds } 
    }).select('_id name slug').sort({ name: 1 });

    // Đếm số sách của mỗi tác giả theo từ khóa
    const authorsWithBookCount = await Promise.all(
      authors.map(async (author) => {
        const bookCount = await Book.countDocuments({ 
          authors: author._id,
          title: { 
            $regex: keyword.trim(), 
            $options: 'i' 
          },
          active: true
        });
        return {
          ...author.toObject(),
          bookCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: authorsWithBookCount.length,
      keyword: keyword.trim(),
      data: authorsWithBookCount
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tác giả theo từ khóa sách:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tác giả theo từ khóa sách',
      error: error.message
    });
  }
};
