import Favorite from '../models/favorite.js';
import Book from '../models/book.js';
import mongoose from 'mongoose';

// @desc    Toggle thêm/xóa sách khỏi danh sách yêu thích
// @route   POST /api/favorites/toggle
// @access  Private
export const toggleFavorite = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    // Kiểm tra bookId có hợp lệ không
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }

    // Kiểm tra sách có tồn tại không
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Kiểm tra xem người dùng đã thêm sách này vào yêu thích chưa
    const existingFavorite = await Favorite.findOne({ user: userId, book: bookId });

    if (existingFavorite) {
      // Nếu đã thêm rồi thì xóa đi (bỏ yêu thích)
      await Favorite.deleteOne({ _id: existingFavorite._id });
      return res.status(200).json({
        success: true,
        message: 'Đã xóa sách khỏi danh sách yêu thích',
        isFavorited: false
      });
    } else {
      // Nếu chưa thêm thì tạo mới (thêm vào yêu thích)
      const newFavorite = await Favorite.create({
        user: userId,
        book: bookId
      });
      
      return res.status(201).json({
        success: true,
        message: 'Đã thêm sách vào danh sách yêu thích',
        favorite: newFavorite,
        isFavorited: true
      });
    }
  } catch (error) {
    console.error('Lỗi khi thao tác với danh sách yêu thích:', error);
    
    // Xử lý lỗi trùng lặp (nếu có)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Sách này đã được thêm vào danh sách yêu thích'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thao tác với danh sách yêu thích',
      error: error.message
    });
  }
};

// @desc    Kiểm tra trạng thái yêu thích của một sách
// @route   GET /api/favorites/check/:bookId
// @access  Private
export const checkFavoriteStatus = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Kiểm tra bookId có hợp lệ không
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }

    // Kiểm tra xem sách có trong danh sách yêu thích không
    const favorite = await Favorite.findOne({ user: userId, book: bookId });
    
    return res.status(200).json({
      success: true,
      isFavorited: !!favorite
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra trạng thái yêu thích',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách sách yêu thích của người dùng
// @route   GET /api/favorites
// @access  Private
export const getFavoriteBooks = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // Đếm tổng số sách yêu thích
    const total = await Favorite.countDocuments({ user: userId });
    
    // Lấy danh sách yêu thích với thông tin chi tiết về sách
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'book',
        select: 'title slug coverImages ebookOptions averageRating totalReviews featured documentType authors pages',
        populate: [
          { path: 'authors', select: 'name slug' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: favorites.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: favorites
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách yêu thích:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách yêu thích',
      error: error.message
    });
  }
};

// @desc    Xóa một sách khỏi danh sách yêu thích
// @route   DELETE /api/favorites/:bookId
// @access  Private
export const removeFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Kiểm tra bookId có hợp lệ không
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }

    // Tìm và xóa mục yêu thích
    const result = await Favorite.deleteOne({ user: userId, book: bookId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sách không có trong danh sách yêu thích'
      });
    }

    // Đếm lại tổng số sách yêu thích sau khi xóa
    const totalRemaining = await Favorite.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      message: 'Đã xóa sách khỏi danh sách yêu thích',
      totalRemaining: totalRemaining
    });
  } catch (error) {
    console.error('Lỗi khi xóa khỏi danh sách yêu thích:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa khỏi danh sách yêu thích',
      error: error.message
    });
  }
};
