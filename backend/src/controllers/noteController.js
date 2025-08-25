import Note from '../models/note.js';
import EbookLicense from '../models/ebookLicense.js';

// Lấy danh sách ghi chú của user trong một cuốn sách
const getNotes = async (req, res) => {
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
        message: 'Bạn không có quyền truy cập ghi chú của cuốn sách này'
      });
    }

    // Lấy danh sách ghi chú
    const notes = await Note.find({
      user: userId,
      book: bookId
    })
    .populate('book', 'title')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes,
      count: notes.length
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách ghi chú:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách ghi chú'
    });
  }
};

// Tạo ghi chú mới
const createNote = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;
    const { cfi, content, selectedText } = req.body;

    // Validate dữ liệu đầu vào
    if (!cfi || !content) {
      return res.status(400).json({
        success: false,
        message: 'CFI và nội dung ghi chú là bắt buộc'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung ghi chú không được vượt quá 2000 ký tự'
      });
    }

    if (selectedText && selectedText.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Text được chọn không được vượt quá 500 ký tự'
      });
    }

    // Kiểm tra quyền truy cập sách
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookId,
      status: 'active'
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo ghi chú cho cuốn sách này'
      });
    }

    // Tạo ghi chú mới
    const newNote = new Note({
      user: userId,
      book: bookId,
      cfi: cfi.trim(),
      content: content.trim(),
      selectedText: selectedText ? selectedText.trim() : undefined
    });

    const savedNote = await newNote.save();
    await savedNote.populate('book', 'title');

    res.status(201).json({
      success: true,
      data: savedNote,
      message: 'Đã tạo ghi chú thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi khi tạo ghi chú:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo ghi chú'
    });
  }
};

// Cập nhật ghi chú
const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    const { content, selectedText } = req.body;

    // Validate dữ liệu đầu vào
    if (content && content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung ghi chú không được vượt quá 2000 ký tự'
      });
    }

    if (selectedText && selectedText.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Text được chọn không được vượt quá 500 ký tự'
      });
    }

    // Tìm ghi chú
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú'
      });
    }

    // Kiểm tra quyền sở hữu
    if (!note.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa ghi chú này'
      });
    }

    // Cập nhật thông tin
    const updateData = {};
    if (content !== undefined) updateData.content = content.trim();
    if (selectedText !== undefined) updateData.selectedText = selectedText ? selectedText.trim() : undefined;

    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      updateData,
      { new: true, runValidators: true }
    ).populate('book', 'title');

    res.json({
      success: true,
      data: updatedNote,
      message: 'Đã cập nhật ghi chú thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật ghi chú:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật ghi chú'
    });
  }
};

// Xóa một ghi chú
const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    // Tìm ghi chú
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú'
      });
    }

    // Kiểm tra quyền sở hữu
    if (!note.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa ghi chú này'
      });
    }

    await Note.findByIdAndDelete(noteId);

    res.json({
      success: true,
      message: 'Đã xóa ghi chú thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi khi xóa ghi chú:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa ghi chú'
    });
  }
};

// Xóa tất cả ghi chú của user trong một cuốn sách
const deleteAllNotes = async (req, res) => {
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
        message: 'Bạn không có quyền xóa ghi chú của cuốn sách này'
      });
    }

    // Xóa tất cả ghi chú
    const result = await Note.deleteAllUserBookNotes(userId, bookId);

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `Đã xóa ${result.deletedCount} ghi chú thành công`
    });
  } catch (error) {
    console.error('❌ Lỗi khi xóa tất cả ghi chú:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa ghi chú'
    });
  }
};

// Lấy thông tin chi tiết một ghi chú
const getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(noteId).populate('book', 'title');
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú'
      });
    }

    // Kiểm tra quyền sở hữu
    if (!note.isOwnedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập ghi chú này'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy thông tin ghi chú:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin ghi chú'
    });
  }
};

export {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  deleteAllNotes,
  getNoteById
};

export default {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  deleteAllNotes,
  getNoteById
};
