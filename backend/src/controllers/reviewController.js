import Review from '../models/review.js';
import Book from '../models/book.js';
import EbookLicense from '../models/ebookLicense.js';
import mongoose from 'mongoose';

/**
 * @desc    Tạo đánh giá sách mới
 * @route   POST /api/books/:bookId/reviews
 * @access  Private (chỉ user có bản quyền vĩnh viễn)
 */
export const createReview = async (req, res) => {  try {
    const { bookId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }

    // Kiểm tra người dùng có được quyền đánh giá không
    const eligibility = await Review.checkReviewEligibility(userId, bookId);

    if (!eligibility.canReview && !eligibility.canUpdate) {
      return res.status(403).json({
        success: false,
        message: eligibility.reason
      });
    }

    // Nếu đã có đánh giá của người dùng này cho sách này, không cho tạo mới
    if (eligibility.canUpdate && eligibility.existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sách này trước đó, hãy cập nhật đánh giá thay vì tạo mới',
        reviewId: eligibility.existingReview._id
      });
    }

    // Tạo đánh giá mới
    const newReview = await Review.create({
      user: userId,
      book: bookId,
      license: eligibility.license._id,
      rating,
      content,
      status: 'active'
    });

    // Populate thông tin user trước khi trả về
    const populatedReview = await Review.findById(newReview._id)
      .populate({
        path: 'user',
        select: 'name email avatar'
      });

    // Trả về thành công
    return res.status(201).json({
      success: true,
      message: 'Đánh giá thành công',
      data: populatedReview
    });
  } catch (error) {
    console.error('Lỗi khi tạo đánh giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đánh giá sách',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật đánh giá - Chức năng đã bị loại bỏ
 * @route   PUT /api/reviews/:id
 * @access  Private - Chức năng không còn khả dụng
 */
// Phương thức updateReview đã bị loại bỏ theo yêu cầu

/**
 * @desc    Xóa đánh giá
 * @route   DELETE /api/reviews/:id
 * @access  Private (chỉ author của review hoặc admin)
 */
export const deleteReview = async (req, res) => {  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Kiểm tra ID đánh giá có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đánh giá không hợp lệ'
      });
    }

    // Tìm đánh giá cần xóa
    const review = await Review.findById(id);

    // Kiểm tra đánh giá có tồn tại không
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }    // Kiểm tra quyền xóa (chỉ admin có thể xóa)
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản trị viên mới có quyền xóa đánh giá'
      });
    }

    // Xóa đánh giá
    await review.remove();

    return res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa đánh giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách đánh giá của một sách
 * @route   GET /api/books/:bookId/reviews
 * @access  Public
 */
export const getBookReviews = async (req, res) => {  try {
    const { bookId } = req.params;
    const { sort = '-createdAt' } = req.query;

    // Kiểm tra ID sách có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
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

    // Tính tổng số đánh giá
    const total = await Review.countDocuments({
      book: bookId,
      status: 'active'
    });    // Lấy tất cả đánh giá không phân trang
    const reviews = await Review.find({
      book: bookId,
      status: 'active'
    })
      .sort(sort)
      .populate({
        path: 'user',
        select: 'name email avatar'
      });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      data: reviews
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Kiểm tra người dùng có thể đánh giá sách không
 * @route   GET /api/books/:bookId/review-eligibility
 * @access  Private
 */
export const checkReviewEligibility = async (req, res) => {  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Kiểm tra ID sách có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
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

    // Kiểm tra điều kiện để đánh giá
    const result = await Review.checkReviewEligibility(userId, bookId);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra điều kiện đánh giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra điều kiện đánh giá',
      error: error.message
    });
  }
};
