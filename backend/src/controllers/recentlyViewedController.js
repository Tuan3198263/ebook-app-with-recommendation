import RecentlyViewed from '../models/recentlyViewed.js';
import mongoose from 'mongoose';

// @desc    Thêm hoặc cập nhật sách đã xem
// @route   POST /api/recently-viewed
// @access  Private (Logged in users only)
export const addOrUpdateView = async (req, res) => {
  try {
    const { bookId, duration = 0, interactionScore = 1 } = req.body;
    const userId = req.user?.id;

    // Kiểm tra user đã đăng nhập
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để sử dụng tính năng này'
      });
    }

    // Kiểm tra bookId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }

    // Sử dụng static method từ model
    const result = await RecentlyViewed.addOrUpdateView(userId, bookId, duration, interactionScore);

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật lịch sử xem',
      data: result
    });
  } catch (error) {
    console.error('Lỗi khi thêm/cập nhật lịch sử xem:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch sử xem',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách sách đã xem gần đây
// @route   GET /api/recently-viewed
// @access  Private (User only)
export const getRecentViews = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const userId = req.user?.id;

    // Chỉ cho phép user đã đăng nhập
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch sử'
      });
    }

    // Chuyển đổi page và limit thành số
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Xác định identifier (chỉ userId)
    const identifier = { userId };

    // Lấy user history document
    const userHistory = await RecentlyViewed.findOne({ userId })
      .populate('viewedBooks.bookId', 'title slug coverImages category authors documentType averageRating description ebookOptions pages');

    if (!userHistory || !userHistory.viewedBooks.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        totalPages: 0,
        currentPage: pageNum,
        data: []
      });
    }

    // Áp dụng phân trang trên array viewedBooks
    const totalBooks = userHistory.viewedBooks.length;
    const totalPages = Math.ceil(totalBooks / limitNum);
    const paginatedBooks = userHistory.viewedBooks.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paginatedBooks.length,
      totalBooks: totalBooks,
      totalPages: totalPages,
      currentPage: pageNum,
      data: paginatedBooks
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử xem:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử xem',
      error: error.message
    });
  }
};

// @desc    Lấy dữ liệu tương tác của user (cho hệ thống gợi ý)
// @route   GET /api/recently-viewed/interactions
// @access  Private (Logged in users only)
// @desc    Migration dữ liệu cũ (admin only)
// @route   POST /api/recently-viewed/migrate
// @access  Private (Admin)
export const migrateOldData = async (req, res) => {
  try {
    // Check if user is admin (implement your admin check logic)
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền chạy migration'
      });
    }

    const migratedCount = await RecentlyViewed.migrateOldData();

    res.status(200).json({
      success: true,
      message: `Migration hoàn thành! Đã cập nhật ${migratedCount} documents.`,
      migratedCount
    });
  } catch (error) {
    console.error('Lỗi khi migration:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi migration dữ liệu',
      error: error.message
    });
  }
};

// @desc    Lấy dữ liệu tương tác của user (cho hệ thống gợi ý)
// @route   GET /api/recently-viewed/interactions
// @access  Private (Logged in users only)
export const getUserInteractions = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Kiểm tra user đã đăng nhập
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để sử dụng tính năng này'
      });
    }

    // Sử dụng static method từ model
    const interactions = await RecentlyViewed.getUserInteractions(userId);

    res.status(200).json({
      success: true,
      count: interactions.viewedBooks.length,
      data: interactions.viewedBooks
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu tương tác:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu tương tác',
      error: error.message
    });
  }
};

// @desc    Xóa một sách khỏi lịch sử xem
// @route   DELETE /api/recently-viewed/:bookId
// @access  Private (Logged in users only)
export const removeFromHistory = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.id;

    // Kiểm tra user đã đăng nhập
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để sử dụng tính năng này'
      });
    }

    // Kiểm tra bookId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }

    // Sử dụng static method từ model
    const success = await RecentlyViewed.removeBook(userId, bookId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách trong lịch sử xem'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa sách khỏi lịch sử xem'
    });
  } catch (error) {
    console.error('Lỗi khi xóa khỏi lịch sử xem:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa khỏi lịch sử xem',
      error: error.message
    });
  }
};

// @desc    Xóa toàn bộ lịch sử xem
// @route   DELETE /api/recently-viewed
// @access  Private (Logged in users only)
export const clearHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Kiểm tra user đã đăng nhập
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để sử dụng tính năng này'
      });
    }

    // Xóa lịch sử
    const result = await RecentlyViewed.clearHistory(userId);

    res.status(200).json({
      success: true,
      message: 'Đã xóa toàn bộ lịch sử xem',
      deletedCount: result ? 1 : 0
    });
  } catch (error) {
    console.error('Lỗi khi xóa toàn bộ lịch sử xem:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa toàn bộ lịch sử xem',
      error: error.message
    });
  }
};

// @desc    Cleanup session data cũ (có thể chạy định kỳ)
// @route   DELETE /api/recently-viewed/cleanup-sessions
// @access  Private (Admin)
export const cleanupSessionData = async (req, res) => {
  try {
    // Function này không còn cần thiết vì đã bỏ session support
    res.status(200).json({
      success: true,
      message: 'Cleanup session data không cần thiết - hệ thống chỉ hỗ trợ user đã đăng nhập',
      deletedCount: 0
    });
  } catch (error) {
    console.error('Lỗi khi cleanup session data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cleanup session data',
      error: error.message
    });
  }
};

// Helper function để cleanup session data cũ (không còn cần thiết)
async function cleanupOldSessionData() {
  // Function này không còn cần thiết vì đã bỏ session support
  console.log('Cleanup session data không cần thiết - hệ thống chỉ hỗ trợ user đã đăng nhập');
}
