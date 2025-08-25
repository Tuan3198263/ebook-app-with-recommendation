import { uploadToS3, deleteFromS3 } from '../config/s3Config.js';

// Ví dụ upload ebook từ buffer
export const uploadEbook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng tải lên file ebook' 
      });
    }
    
    const result = await uploadToS3(
      req.file.buffer,
      `Book/${Date.now()}-${req.file.originalname}`,
      req.file.mimetype
    );
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể tải file lên S3', 
        error: result.error 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Tải lên ebook thành công',
      fileUrl: result.url,
      fileKey: result.key
    });
  } catch (error) {
    console.error('Lỗi khi upload ebook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi xử lý upload', 
      error: error.message 
    });
  }
};

// Ví dụ xóa ebook
export const deleteEbook = async (req, res) => {
  try {
    const { fileKey } = req.params;
    
    if (!fileKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp key của file cần xóa' 
      });
    }
    
    const result = await deleteFromS3(fileKey);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể xóa file từ S3', 
        error: result.error 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Xóa ebook thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa ebook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi xử lý xóa file', 
      error: error.message 
    });
  }
};
