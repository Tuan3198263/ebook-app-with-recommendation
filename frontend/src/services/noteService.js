import api from './api.js';

/**
 * Service để quản lý ghi chú (Notes) từ frontend
 */
class NoteService {
  
  /**
   * Lấy danh sách ghi chú của user trong một cuốn sách
   * @param {string} bookId - ID của cuốn sách
   * @returns {Promise<Object>} Response chứa danh sách ghi chú
   */
  async getNotes(bookId) {
    try {
      console.log('📝 Getting notes for book:', bookId);
      const response = await api.get(`/books/${bookId}/notes`);
      
      if (response.data.success) {
        console.log('✅ Notes retrieved successfully:', response.data.data.length, 'notes');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Không thể lấy danh sách ghi chú');
      }
    } catch (error) {
      console.error('❌ Error getting notes:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách ghi chú');
    }
  }

  /**
   * Tạo ghi chú mới
   * @param {string} bookId - ID của cuốn sách
   * @param {Object} noteData - Dữ liệu ghi chú
   * @param {string} noteData.cfi - CFI position
   * @param {string} noteData.content - Nội dung ghi chú
   * @param {string} [noteData.selectedText] - Text được chọn (tùy chọn)
   * @returns {Promise<Object>} Response chứa ghi chú mới được tạo
   */
  async createNote(bookId, noteData) {
    try {
      // Validate dữ liệu đầu vào
      const validation = this.validateNoteData(noteData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      console.log('📝 Creating note for book:', bookId, noteData);
      const response = await api.post(`/books/${bookId}/notes`, noteData);
      
      if (response.data.success) {
        console.log('✅ Note created successfully:', response.data.data._id);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Không thể tạo ghi chú');
      }
    } catch (error) {
      console.error('❌ Error creating note:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo ghi chú');
    }
  }

  /**
   * Cập nhật ghi chú
   * @param {string} noteId - ID của ghi chú
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Response chứa ghi chú đã được cập nhật
   */
  async updateNote(noteId, updateData) {
    try {
      console.log('📝 Updating note:', noteId, updateData);
      const response = await api.put(`/notes/${noteId}`, updateData);
      
      if (response.data.success) {
        console.log('✅ Note updated successfully:', noteId);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Không thể cập nhật ghi chú');
      }
    } catch (error) {
      console.error('❌ Error updating note:', error);
      if (error.response?.status === 500) {
        throw new Error('Lỗi server khi cập nhật ghi chú');
      }
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật ghi chú');
    }
  }

  /**
   * Xóa một ghi chú
   * @param {string} noteId - ID của ghi chú
   * @returns {Promise<Object>} Response xác nhận xóa
   */
  async deleteNote(noteId) {
    try {
      console.log('🗑️ Deleting note:', noteId);
      const response = await api.delete(`/notes/${noteId}`);
      
      if (response.data.success) {
        console.log('✅ Note deleted successfully:', noteId);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Không thể xóa ghi chú');
      }
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa ghi chú');
    }
  }

  /**
   * Xóa tất cả ghi chú của user trong một cuốn sách
   * @param {string} bookId - ID của cuốn sách
   * @returns {Promise<Object>} Response xác nhận xóa
   */
  async deleteAllNotes(bookId) {
    try {
      console.log('🗑️ Deleting all notes for book:', bookId);
      const response = await api.delete(`/books/${bookId}/notes`);
      
      if (response.data.success) {
        console.log('✅ All notes deleted successfully for book:', bookId);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Không thể xóa ghi chú');
      }
    } catch (error) {
      console.error('❌ Error deleting all notes:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa ghi chú');
    }
  }

  /**
   * Lấy thông tin chi tiết một ghi chú
   * @param {string} noteId - ID của ghi chú
   * @returns {Promise<Object>} Response chứa thông tin ghi chú
   */
  async getNoteById(noteId) {
    try {
      console.log('📝 Getting note by ID:', noteId);
      const response = await api.get(`/notes/${noteId}`);
      
      if (response.data.success) {
        console.log('✅ Note retrieved successfully:', noteId);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Không thể lấy thông tin ghi chú');
      }
    } catch (error) {
      console.error('❌ Error getting note:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin ghi chú');
    }
  }

  /**
   * Validate dữ liệu ghi chú
   * @param {Object} noteData - Dữ liệu cần validate
   * @returns {Object} Kết quả validation
   */
  validateNoteData(noteData) {
    const errors = [];

    // Kiểm tra CFI
    if (!noteData.cfi || typeof noteData.cfi !== 'string' || !noteData.cfi.trim()) {
      errors.push('CFI là bắt buộc');
    }

    // Kiểm tra content
    if (!noteData.content || typeof noteData.content !== 'string' || !noteData.content.trim()) {
      errors.push('Nội dung ghi chú là bắt buộc');
    } else if (noteData.content.length > 2000) {
      errors.push('Nội dung ghi chú không được vượt quá 2000 ký tự');
    }

    // Kiểm tra selectedText (tùy chọn)
    if (noteData.selectedText && noteData.selectedText.length > 500) {
      errors.push('Text được chọn không được vượt quá 500 ký tự');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Format dữ liệu ghi chú cho hiển thị
   * @param {Object} note - Raw note data từ server
   * @returns {Object} Formatted note data
   */
  formatNote(note) {
    if (!note) return null;

    return {
      id: note._id,
      cfi: note.cfi,
      content: note.content,
      selectedText: note.selectedText || null,
      bookId: note.book?._id || note.book,
      bookTitle: note.book?.title || null,
      userId: note.user,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      // Helper để kiểm tra xem có phải là highlight không
      isHighlight: !!note.selectedText,
      // Tạo preview ngắn của content
      contentPreview: note.content?.length > 100 ? 
        note.content.substring(0, 100) + '...' : 
        note.content
    };
  }

  /**
   * Tìm ghi chú theo CFI
   * @param {Array} notes - Danh sách ghi chú
   * @param {string} cfi - CFI cần tìm
   * @returns {Object|null} Ghi chú tìm thấy hoặc null
   */
  findNoteByCfi(notes, cfi) {
    if (!notes || !Array.isArray(notes) || !cfi) return null;
    
    return notes.find(note => note.cfi === cfi) || null;
  }

  /**
   * Lọc ghi chú theo loại (highlight hoặc note thuần)
   * @param {Array} notes - Danh sách ghi chú
   * @param {string} type - 'highlight' hoặc 'note'
   * @returns {Array} Danh sách ghi chú đã lọc
   */
  filterNotesByType(notes, type) {
    if (!notes || !Array.isArray(notes)) return [];
    
    if (type === 'highlight') {
      return notes.filter(note => note.selectedText);
    } else if (type === 'note') {
      return notes.filter(note => !note.selectedText);
    }
    
    return notes;
  }

  /**
   * Sắp xếp ghi chú theo thời gian tạo
   * @param {Array} notes - Danh sách ghi chú
   * @param {string} order - 'asc' hoặc 'desc'
   * @returns {Array} Danh sách ghi chú đã sắp xếp
   */
  sortNotesByDate(notes, order = 'desc') {
    if (!notes || !Array.isArray(notes)) return [];
    
    return [...notes].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      if (order === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }
}

// Export singleton instance
const noteService = new NoteService();
export default noteService;
