import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  // Liên kết với user và book
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  
  // Vị trí trong sách (CFI - Canonical Fragment Identifier)
  cfi: {
    type: String,
    required: true,
    trim: true
  },
  
  // Nội dung ghi chú
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Text được chọn/highlight (tùy chọn)
  selectedText: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index compound cho query hiệu quả
noteSchema.index({ user: 1, book: 1 });
noteSchema.index({ user: 1, book: 1, cfi: 1 });

// Static method để xóa tất cả ghi chú của user trong một cuốn sách
noteSchema.statics.deleteAllUserBookNotes = async function(userId, bookId) {
  try {
    const result = await this.deleteMany({
      user: userId,
      book: bookId
    });
    return result;
  } catch (error) {
    throw new Error(`Lỗi khi xóa ghi chú: ${error.message}`);
  }
};

// Instance method để kiểm tra quyền sở hữu
noteSchema.methods.isOwnedBy = function(userId) {
  return this.user.toString() === userId.toString();
};

const Note = mongoose.model('Note', noteSchema);
export default Note;
