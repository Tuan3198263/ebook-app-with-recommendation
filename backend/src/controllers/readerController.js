import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Book from '../models/book.js';
import EbookLicense from '../models/ebookLicense.js';
import { s3Client } from '../config/s3Config.js';

// Proxy endpoint để serve file trực tiếp từ S3 qua backend
export const proxyEbook = async (req, res) => {
  try {
    const { bookId, format } = req.params;
    const userId = req.user.id;

    console.log("🔄 Proxy ebook request:", { bookId, format, userId });

    // Kiểm tra sách có tồn tại không
    const book = await Book.findById(bookId);
    if (!book) {
      console.log("❌ Book not found:", bookId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Kiểm tra format có hợp lệ không (chỉ EPUB cho proxy)
    if (format !== 'epub') {
      console.log("❌ Invalid format for proxy:", format);
      return res.status(400).json({
        success: false,
        message: 'Chỉ hỗ trợ định dạng EPUB cho proxy'
      });
    }

    // Kiểm tra sách có hỗ trợ format này không
    if (!book.availableFormats.includes(format)) {
      console.log("❌ Format not available:", { format, availableFormats: book.availableFormats });
      return res.status(400).json({
        success: false,
        message: `Sách này chưa hỗ trợ đọc trực tuyến. Vui lòng tải sách về để đọc offline.`
      });
    }

    // Kiểm tra người dùng có quyền đọc sách này không
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookId,
      status: 'active'
    });

    if (!license) {
      console.log("❌ No license found:", { userId, bookId });
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đọc sách này'
      });
    }

    console.log("✅ License found, proxying file");

    // Lấy đường dẫn file từ S3
    const fileUrl = book.bookFiles[format];
    if (!fileUrl) {
      console.log("❌ No file URL found for format:", format);
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy file ${format.toUpperCase()}`
      });
    }

    // Extract key từ full URL (nếu lưu full URL) hoặc sử dụng trực tiếp (nếu lưu key)
    let fileKey;
    if (fileUrl.startsWith('https://')) {
      const url = new URL(fileUrl);
      fileKey = url.pathname.substring(1); // Bỏ dấu "/" đầu
    } else {
      fileKey = fileUrl;
    }
    
    console.log("📁 Proxying file key:", fileKey);

    // Check ETag trước khi gọi S3 để tiết kiệm requests
    const eTag = `"${bookId}-${format}-v1"`;
    const clientETag = req.headers['if-none-match'];
    
    if (clientETag === eTag) {
      console.log("✅ Client has cached version, returning 304 - S3 request saved!");
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('ETag', eTag);
      return res.status(304).end(); // Not Modified - saves S3 request!
    }

    try {
      // Fetch file từ S3 và stream trực tiếp qua response
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey
      });

      console.log("📡 Fetching from S3 (cache miss)...");
      const s3Response = await s3Client.send(command);
      
      // Set appropriate headers với caching để tiết kiệm S3 requests
      const contentType = format === 'epub' ? 'application/epub+zip' : 'application/pdf';
      
      res.setHeader('Content-Type', contentType);
      if (s3Response.ContentLength) {
        res.setHeader('Content-Length', s3Response.ContentLength);
      }
      
      // Caching headers để browser cache file trong 24 hours
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      res.setHeader('ETag', eTag);
      res.setHeader('Last-Modified', new Date().toUTCString());
      
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-None-Match');
      res.setHeader('Access-Control-Expose-Headers', 'ETag, Cache-Control, Last-Modified');

      // Stream file content
      s3Response.Body.pipe(res);

    } catch (s3Error) {
      console.error('❌ S3 Error:', s3Error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi truy cập file'
      });
    }

  } catch (error) {
    console.error('Error proxying ebook:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Kiểm tra quyền truy cập và stream file ebook
export const streamEbook = async (req, res) => {
  try {
    const { bookId, format } = req.params;
    const userId = req.user.id;

    console.log("📖 Stream ebook request:", { bookId, format, userId });

    // Kiểm tra sách có tồn tại không
    const book = await Book.findById(bookId);
    if (!book) {
      console.log("❌ Book not found:", bookId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    console.log("📖 Book found:", {
      title: book.title,
      availableFormats: book.availableFormats,
      bookFiles: book.bookFiles
    });

    // Kiểm tra format có hợp lệ không
    if (!['epub', 'pdf'].includes(format)) {
      console.log("❌ Invalid format:", format);
      return res.status(400).json({
        success: false,
        message: 'Định dạng file không hợp lệ'
      });
    }

    // Kiểm tra sách có hỗ trợ format này không
    if (!book.availableFormats.includes(format)) {
      console.log("❌ Format not available:", { format, availableFormats: book.availableFormats });
      const formatMessage = format === 'pdf' ? 
        'Sách này chưa hỗ trợ tải xuống định dạng PDF. Vui lòng liên hệ quản trị viên để được hỗ trợ.' :
        `Sách này không có định dạng ${format.toUpperCase()}`;
      return res.status(400).json({
        success: false,
        message: formatMessage
      });
    }

    // Kiểm tra người dùng có quyền đọc sách này không
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookId,
      status: 'active'
    });

    if (!license) {
      console.log("❌ No license found:", { userId, bookId });
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đọc sách này'
      });
    }

    console.log("✅ License found:", {
      licenseId: license._id,
      status: license.status,
      validUntil: license.validUntil
    });

    // Lấy đường dẫn file từ S3
    const fileUrl = book.bookFiles[format];
    console.log("📁 File URL from DB:", fileUrl);
    
    if (!fileUrl) {
      console.log("❌ No file URL found for format:", format);
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy file ${format.toUpperCase()}`
      });
    }

    // Extract key từ full URL (nếu lưu full URL) hoặc sử dụng trực tiếp (nếu lưu key)
    let fileKey;
    if (fileUrl.startsWith('https://')) {
      // Nếu lưu full URL, extract key
      const url = new URL(fileUrl);
      fileKey = url.pathname.substring(1); // Bỏ dấu "/" đầu
    } else {
      // Nếu lưu key trực tiếp
      fileKey = fileUrl;
    }
    
    console.log("📁 Extracted file key:", fileKey);

    try {
      // Tạo signed URL để stream file sử dụng AWS SDK v3
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey
      });

      console.log("🔗 Creating signed URL for:", {
        bucket: process.env.AWS_S3_BUCKET,
        key: fileKey
      });

      const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600 // URL có hiệu lực trong 1 giờ
      });

      console.log("✅ Signed URL created successfully");

      res.json({
        success: true,
        data: {
          fileUrl: signedUrl,
          format: format,
          contentType: format === 'epub' ? 'application/epub+zip' : 'application/pdf'
        }
      });
    } catch (s3Error) {
      console.error('❌ S3 Error:', s3Error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi truy cập file'
      });
    }

  } catch (error) {
    console.error('Error streaming ebook:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy thông tin chi tiết cho reader
export const getReaderData = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Lấy thông tin sách
    const book = await Book.findById(bookId)
      .populate('authors', 'name')
      .populate('category', 'name');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Kiểm tra quyền truy cập
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookId,
      status: 'active'
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đọc sách này'
      });
    }

    // Trả về thông tin cần thiết cho reader
    res.json({
      success: true,
      data: {
        book: {
          id: book._id,
          title: book.title,
          slug: book.slug,
          authors: book.authors,
          category: book.category,
          coverImages: book.coverImages,
          description: book.description,
          pages: book.pages,
          availableFormats: book.availableFormats,
          primaryFormat: book.primaryFormat
        },
        license: {
          id: license._id,
          validFrom: license.validFrom,
          validUntil: license.validUntil,
          status: license.status,
          licenseType: license.licenseType,
          readingProgress: license.readingProgress
        }
      }
    });

  } catch (error) {
    console.error('Error getting reader data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy URL tải xuống cho PDF
export const getPdfDownloadUrl = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Kiểm tra sách có tồn tại không
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Kiểm tra sách có PDF không
    if (!book.availableFormats.includes('pdf')) {
      return res.status(400).json({
        success: false,
        message: 'Sách này không có định dạng PDF'
      });
    }

    // Kiểm tra người dùng có quyền đọc sách này không
    const license = await EbookLicense.findOne({
      user: userId,
      book: bookId,
      status: 'active'
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đọc sách này'
      });
    }

    // Lấy đường dẫn file PDF từ S3
    const pdfUrl = book.bookFiles.pdf;
    if (!pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy file PDF'
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl: pdfUrl,
        filename: `${book.title}.pdf`,
        contentType: 'application/pdf'
      }
    });

  } catch (error) {
    console.error('Error getting PDF download URL:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};
