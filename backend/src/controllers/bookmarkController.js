import Bookmark from '../models/bookmark.js';
import EbookLicense from '../models/ebookLicense.js';
import Book from '../models/book.js';

// Lấy danh sách bookmark của user cho một cuốn sách
export const getBookmarks = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền truy cập sách
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookId,
      status: 'active'
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập sách này'
      });
    }

    // Lấy bookmarks
    const bookmarks = await Bookmark.getUserBookmarks(userId, bookId);

    res.json({
      success: true,
      data: bookmarks
    });

  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Tạo bookmark mới
export const createBookmark = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;
    const { cfi, title } = req.body;

    // Kiểm tra quyền tạo bookmark
    const canCreate = await Bookmark.canCreateBookmark(userId, bookId);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo bookmark cho sách này'
      });
    }

    // Kiểm tra bookmark đã tồn tại tại vị trí này chưa
    const existingBookmark = await Bookmark.findOne({
      user: userId,
      book: bookId,
      cfi: cfi
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: 'Bookmark đã tồn tại tại vị trí này'
      });
    }

    // Tạo bookmark mới
    const bookmark = new Bookmark({
      user: userId,
      book: bookId,
      cfi,
      title
    });

    await bookmark.save();

    res.status(201).json({
      success: true,
      data: bookmark,
      message: 'Bookmark đã được tạo thành công'
    });

  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Cập nhật bookmark
export const updateBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title } = req.body;

    // Tìm bookmark
    const bookmark = await Bookmark.findOne({
      _id: id,
      user: userId
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bookmark'
      });
    }

    // Kiểm tra quyền truy cập sách (bookmark có thể tồn tại nhưng license đã hết hạn)
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookmark.book,
      status: 'active'
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không còn quyền truy cập sách này'
      });
    }

    // Cập nhật bookmark
    if (title) bookmark.title = title;

    await bookmark.save();

    res.json({
      success: true,
      data: bookmark,
      message: 'Bookmark đã được cập nhật'
    });

  } catch (error) {
    console.error('Error updating bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Xóa bookmark
export const deleteBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Tìm và xóa bookmark
    const bookmark = await Bookmark.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bookmark'
      });
    }

    res.json({
      success: true,
      message: 'Bookmark đã được xóa'
    });

  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy tất cả bookmark của user (across all books)
export const getAllUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Lấy tất cả license active của user
    const activeLicenses = await EbookLicense.find({
      user: userId,
      status: 'active'
    }).select('book');

    const bookIds = activeLicenses.map(license => license.book);

    // Lấy bookmarks từ các sách user có quyền truy cập
    const bookmarks = await Bookmark.find({
      user: userId,
      book: { $in: bookIds }
    })
    .populate('book', 'title coverImages slug')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    const total = await Bookmark.countDocuments({
      user: userId,
      book: { $in: bookIds }
    });

    res.json({
      success: true,
      data: {
        bookmarks: bookmarks.map(bookmark => ({
          id: bookmark._id,
          title: bookmark.title,
          color: bookmark.color,
          cfi: bookmark.cfi,
          createdAt: bookmark.createdAt,
          book: {
            id: bookmark.book._id,
            title: bookmark.book.title,
            coverImage: bookmark.book.coverImages?.thumbnail,
            slug: bookmark.book.slug
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting all user bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Xóa tất cả bookmark của user cho một cuốn sách
export const deleteAllBookmarks = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền truy cập sách
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookId,
      status: 'active'
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập sách này'
      });
    }

    // Xóa tất cả bookmarks
    const result = await Bookmark.deleteAllUserBookmarks(userId, bookId);

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `Đã xóa ${result.deletedCount} dấu trang`
    });

  } catch (error) {
    console.error('Error deleting all bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};
